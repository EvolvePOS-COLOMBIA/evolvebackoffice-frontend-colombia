import { useEffect, useState } from "react"
import { Pencil, Trash2, CheckSquare, Square, Package, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { useItems, useDeleteItem } from "../hooks/use-items"
import type { ItemResponseDto } from "../types"
import { ItemFormDialog } from "./item-form-dialog"

type GlobalCatalogViewProps = {
  onAssignToBranch: (items: ItemResponseDto[]) => void
}

export function GlobalCatalogView({ onAssignToBranch }: GlobalCatalogViewProps) {
  const { t } = useTranslation("business-items-catalog")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<ItemResponseDto | null>(null)

  const { data, isLoading } = useItems({ pageNumber: page, pageSize: 20 })
  const deleteItem = useDeleteItem()

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  const items = data?.data ?? []
  const filteredItems = search
    ? items.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.sku?.toLowerCase().includes(search.toLowerCase())
      )
    : items

  const isMultiSelectMode = selectedIds.size > 0
  const hasSearch = search.trim().length > 0

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAssign = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onAssignToBranch(selectedItems)
    setSelectedIds(new Set())
  }

  const handleEdit = (item: ItemResponseDto) => {
    setItemToEdit(item)
    setFormOpen(true)
  }

  const handleDelete = (item: ItemResponseDto) => {
    if (confirm(t("confirm_delete_item", { name: item.name }))) {
      deleteItem.mutate({ id: item.id, name: item.name ?? "" })
    }
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setItemToEdit(null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="text"
            placeholder={t("search_items")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full max-w-sm px-3 text-sm"
          />
          {isMultiSelectMode && (
            <Badge tone="info" className="shrink-0">
              {selectedIds.size} {t("selected")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isMultiSelectMode && (
            <Button variant="outline" size="sm" onClick={handleAssign}>
              {t("assign_to_branch")}
            </Button>
          )}
          <Button size="sm" onClick={() => setFormOpen(true)}>
            {t("new_item")}
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="min-h-0 flex-1">
          <Table containerClassName="h-full" className="min-w-175">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 w-10">
                  <button onClick={toggleSelectAll} className="flex cursor-pointer items-center">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="size-5 text-primary" />
                    ) : (
                      <Square className="size-5 text-muted-foreground" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 min-w-37.5">{t("name")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 sm:table-cell">{t("sku")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-20 md:table-cell">{t("plu")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-30 md:table-cell">{t("department")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 lg:table-cell">{t("item_type")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-20 lg:table-cell">{t("status")}</TableHead>
                <TableHead className="sticky top-0 z-10 w-24 text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      {hasSearch ? (
                        <>
                          <SearchX className="mb-3 size-10 opacity-40" />
                          <p className="text-sm">{t("no_results_for_search", { search })}</p>
                        </>
                      ) : (
                        <>
                          <Package className="mb-3 size-10 opacity-40" />
                          <p className="text-sm">{t("no_items")}</p>
                          <Button variant="outline" size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
                            {t("new_item")}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-primary/8" : undefined}>
                    <TableCell>
                      <button onClick={() => toggleSelect(item.id)} className="flex cursor-pointer items-center">
                        {selectedIds.has(item.id) ? (
                          <CheckSquare className="size-5 text-primary" />
                        ) : (
                          <Square className="size-5 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{item.sku ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{item.plu}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {item.departmentName ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {item.itemTypeName ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge tone={item.isActive ? "success" : "neutral"}>
                        {item.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEdit(item)}
                          aria-label={t("edit_item")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDelete(item)}
                          aria-label={t("delete_item")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-sm text-muted-foreground">{t("page_info", { current: page, total: data.totalPages })}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <ItemFormDialog open={formOpen} onOpenChange={handleDialogClose} itemToEdit={itemToEdit} />
    </div>
  )
}

function TableSkeleton() {
  const { t } = useTranslation("business-items-catalog")
  return (
    <div className="space-y-0 rounded-lg border">
      {/* Header — columnas reales */}
      <div className="flex items-center border-b border-border/70 bg-muted/50 px-3 py-3">
        <Square className="size-5 text-muted-foreground" />
        <div className="flex-1 pl-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("name")}
        </div>
        <div className="hidden w-25 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase sm:block">
          {t("sku")}
        </div>
        <div className="hidden w-20 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase md:block">
          {t("plu")}
        </div>
        <div className="hidden w-30 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase md:block">
          {t("department")}
        </div>
        <div className="hidden w-25 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase lg:block">
          {t("item_type")}
        </div>
        <div className="hidden w-20 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase lg:block">
          {t("status")}
        </div>
        <div className="w-24 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("actions")}
        </div>
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-border/60 px-3 py-3 last:border-b-0">
          <div className="w-10">
            <Skeleton className="size-5 rounded" />
          </div>
          <div className="flex-1 pl-3">
            <Skeleton className="mb-1 h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="hidden w-25 sm:block">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="hidden w-20 md:block">
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="hidden w-30 md:block">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="hidden w-25 lg:block">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="hidden w-20 lg:block">
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="w-24 text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="size-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
