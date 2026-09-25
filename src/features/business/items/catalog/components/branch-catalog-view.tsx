import { useState } from "react"
import { Pencil, Power, Trash2, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranchItems, useDeleteBranchItem, useSetBranchItemActive } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"
import { BranchItemEditDialog } from "./branch-item-edit-dialog"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"

type BranchCatalogViewProps = {
  branchId: string
  onAssignClick: () => void
}

export function BranchCatalogView({ branchId, onAssignClick }: BranchCatalogViewProps) {
  const { t } = useTranslation("business-items-catalog")
  const [page, setPage] = useState(1)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<BranchItemResponseDto | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<BranchItemResponseDto | null>(null)

  const { data, isLoading } = useBranchItems(branchId, { pageNumber: page, pageSize: 20 })
  const deleteBranchItem = useDeleteBranchItem(branchId)
  const setActive = useSetBranchItemActive(branchId)

  const items = data?.data ?? []
  // Selección derivada de la query: refresca los flags (global/personalizado)
  // automáticamente tras cada mutación de configuración.
  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  const handleEdit = (item: BranchItemResponseDto) => {
    setSelectedItemId(item.id)
    setEditDialogOpen(true)
  }

  // Inactivar (reversible) pide confirmación visual; activar es directo.
  const handleToggleStatus = (item: BranchItemResponseDto) => {
    if (item.inactive) {
      setActive.mutate({ id: item.id, active: true, name: item.itemName ?? "" })
    } else {
      setConfirmDeactivate(item)
    }
  }

  // Eliminar = quitar la asignación de ESTA sucursal (el catálogo general no se toca).
  const handleRemove = (item: BranchItemResponseDto) => {
    setConfirmRemove(item)
  }

  const handleEditDialogClose = (openValue: boolean) => {
    setEditDialogOpen(openValue)
    if (!openValue) setSelectedItemId(null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-end">
        <Button size="sm" onClick={onAssignClick} className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
          <span className="sm:hidden">{t("assign")}</span>
          <span className="hidden sm:inline">{t("assign_products")}</span>
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <BranchTableSkeleton />
      ) : (
        <div className="min-h-0 flex-1 rounded-lg border">
          <Table containerClassName="h-full" className="min-w-0 sm:min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 min-w-0 sm:min-w-37.5 sm:px-4">{t("name")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 sm:table-cell sm:px-4">{t("sku")}</TableHead>
                <TableHead className="sticky top-0 z-10 min-w-20 text-right sm:min-w-25 sm:px-4">
                  {t("price")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 text-right sm:px-4 md:table-cell">
                  {t("sale_price")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 text-right md:table-cell">
                  {t("cost")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 min-w-16 text-right sm:min-w-20 sm:px-4">
                  {t("stock")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-20 sm:px-4 lg:table-cell">{t("status")}</TableHead>
                <TableHead className="sticky top-0 z-10 w-20 text-right sm:w-28 sm:px-4">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground sm:py-12">
                      <Package className="mb-2 size-8 opacity-40 sm:mb-3 sm:size-10" />
                      <p className="text-xs sm:text-sm">{t("no_branch_items")}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 px-2 text-xs sm:mt-4"
                        onClick={onAssignClick}
                      >
                        <span className="sm:hidden">{t("assign")}</span>
                        <span className="hidden sm:inline">{t("assign_products")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.itemName}</p>
                        {item.binLocation && (
                          <p className="text-xs text-muted-foreground">
                            {t("bin")}: {item.binLocation}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 text-muted-foreground sm:table-cell">
                      {item.itemSku ?? "—"}
                    </TableCell>
                    <TableCell className="px-1 text-right font-medium sm:px-4">
                      ${item.price.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="hidden px-4 text-right md:table-cell">
                      ${item.salePrice.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="hidden px-4 text-right text-muted-foreground md:table-cell">
                      ${item.cost.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="px-1 text-right sm:px-4">
                      <StockBadge quantity={item.quantity} reorderPoint={item.reorderPoint} />
                    </TableCell>
                    <TableCell className="hidden px-4 lg:table-cell">
                      <Badge tone={item.inactive ? "neutral" : "success"}>
                        {item.inactive ? t("inactive") : t("active")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-1 text-right sm:px-4">
                      <div className="flex justify-end gap-1 sm:gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7 sm:size-8"
                          onClick={() => handleToggleStatus(item)}
                          aria-label={item.inactive ? t("activate_item") : t("deactivate_item")}
                        >
                          <Power className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7 sm:size-8"
                          onClick={() => handleEdit(item)}
                          aria-label={t("edit_item")}
                        >
                          <Pencil className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-7 text-destructive sm:size-8"
                          onClick={() => handleRemove(item)}
                          aria-label={t("remove_from_branch")}
                        >
                          <Trash2 className="size-3.5 sm:size-4" />
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

      {/* Pagination Footer */}
      <div className="flex shrink-0 items-center justify-between">
        <p className="min-w-0 text-xs text-muted-foreground">
          {t("branch_items_count", { count: data?.totalCount ?? 0 })}
        </p>
        {data && data.totalPages > 1 && (
          <Pagination className="w-fit">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text={t("previous")}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                />
              </PaginationItem>
              {generatePageNumbers(page, data.totalPages).map((pageNum, i) =>
                pageNum === "..." ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink isActive={pageNum === page} onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  text={t("next")}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Edición por pestañas: Precios / Stock / Impuestos / Modificadores */}
      <BranchItemEditDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        branchId={branchId}
        item={selectedItem}
      />

      {/* Confirmación visual: desactivar solo en esta sucursal */}
      <ConfirmActionDialog
        open={confirmDeactivate !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setConfirmDeactivate(null)
        }}
        title={t("branch_deactivate_title")}
        description={t("branch_deactivate_desc", { name: confirmDeactivate?.itemName ?? "" })}
        confirmLabel={t("deactivate_confirm")}
        tone="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (!confirmDeactivate) return
          setActive.mutate(
            { id: confirmDeactivate.id, active: false, name: confirmDeactivate.itemName ?? "" },
            { onSuccess: () => setConfirmDeactivate(null) }
          )
        }}
      />

      {/* Confirmación visual: quitar de esta sucursal (no borra el catálogo general) */}
      <ConfirmActionDialog
        open={confirmRemove !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setConfirmRemove(null)
        }}
        title={t("branch_remove_title")}
        description={t("branch_remove_desc", { name: confirmRemove?.itemName ?? "" })}
        confirmLabel={t("remove_from_branch")}
        tone="destructive"
        isPending={deleteBranchItem.isPending}
        onConfirm={() => {
          if (!confirmRemove) return
          deleteBranchItem.mutate(
            { id: confirmRemove.id, name: confirmRemove.itemName ?? "" },
            { onSuccess: () => setConfirmRemove(null) }
          )
        }}
      />
    </div>
  )
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "...")[] = []

  // Always show first page
  pages.push(1)

  if (current > 3) {
    pages.push("...")
  }

  // Show pages around current
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("...")
  }

  // Always show last page
  if (total > 1) {
    pages.push(total)
  }

  return pages
}

function StockBadge({ quantity, reorderPoint }: { quantity: number; reorderPoint: number }) {
  const isLow = quantity <= reorderPoint

  return (
    <Badge tone={isLow ? "danger" : "neutral"} className="font-mono text-xs">
      {quantity}
    </Badge>
  )
}

function BranchTableSkeleton() {
  const { t } = useTranslation("business-items-catalog")
  return (
    <div className="space-y-0 rounded-lg border">
      {/* Header — columnas reales */}
      <div className="flex items-center border-b border-border/70 bg-muted/50 px-3 py-3">
        <div className="flex-1 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("name")}
        </div>
        <div className="hidden w-25 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase sm:block">
          {t("sku")}
        </div>
        <div className="w-25 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("price")}
        </div>
        <div className="hidden w-25 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase md:block">
          {t("sale_price")}
        </div>
        <div className="hidden w-25 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase md:block">
          {t("cost")}
        </div>
        <div className="w-20 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("stock")}
        </div>
        <div className="hidden w-20 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase lg:block">
          {t("status")}
        </div>
        <div className="w-28 text-right text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {t("actions")}
        </div>
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-border/60 px-3 py-3 last:border-b-0">
          <div className="flex-1">
            <Skeleton className="mb-1 h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="hidden w-25 sm:block">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="w-25 text-right">
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
          <div className="hidden w-25 text-right md:block">
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
          <div className="hidden w-25 text-right md:block">
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
          <div className="w-20 text-right">
            <Skeleton className="ml-auto h-5 w-10 rounded-full" />
          </div>
          <div className="hidden w-20 lg:block">
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="w-28 text-right">
            <div className="flex justify-end gap-1">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="size-8 rounded" />
              <Skeleton className="size-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
