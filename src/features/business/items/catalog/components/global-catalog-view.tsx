import { useState } from "react"
import { Pencil, Trash2, Package, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@/components/data-table"
import { useTranslation } from "@/i18n/use-i18n"
import { useItems, useDeleteItem } from "../hooks/use-items"
import type { ItemResponseDto } from "../types"
import { ItemFormDialog } from "./item-form-dialog"

type GlobalCatalogViewProps = {
  onAssignToBranch: (items: ItemResponseDto[]) => void
}

const itemColumns: ColumnDef<ItemResponseDto>[] = [
  {
    key: "name",
    header: "Name",
    responsive: "always",
    render: (item) => (
      <div>
        <p className="font-medium text-foreground">{item.name}</p>
        {item.description && <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}
      </div>
    ),
  },
  {
    key: "sku",
    header: "SKU",
    responsive: "sm",
    render: (item) => <span className="text-muted-foreground">{item.sku ?? "—"}</span>,
  },
  {
    key: "plu",
    header: "PLU",
    responsive: "md",
    render: (item) => <span className="text-muted-foreground">{item.plu}</span>,
  },
  {
    key: "department",
    header: "Department",
    responsive: "md",
    render: (item) => <span className="text-muted-foreground">{item.departmentName ?? "—"}</span>,
  },
  {
    key: "itemType",
    header: "Item type",
    responsive: "lg",
    render: (item) => <span className="text-muted-foreground">{item.itemTypeName ?? "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    responsive: "lg",
    render: (item) => (
      <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    render: () => null, // placeholder — handled per-row below
  },
]

export function GlobalCatalogView({ onAssignToBranch }: GlobalCatalogViewProps) {
  const { t } = useTranslation("business-items-catalog")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<ItemResponseDto | null>(null)

  const { data, isLoading } = useItems({ pageNumber: page, pageSize: 20 })
  const deleteItem = useDeleteItem()

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

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

  // Columns with per-row actions
  const columns: ColumnDef<ItemResponseDto>[] = [
    ...itemColumns.slice(0, -1), // everything except the placeholder actions column
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (item) => (
        <div className="flex justify-end gap-1 sm:gap-2">
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
            onClick={() => handleDelete(item)}
            aria-label={t("delete_item")}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const handleSelectionChange = (ids: Set<string>) => {
    const itemIds = new Set(
      Array.from(ids)
        .map((idx) => filteredItems[Number(idx)]?.id)
        .filter(Boolean) as string[]
    )
    setSelectedIds(itemIds)
  }

  const toolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          type="text"
          placeholder={t("search_items")}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-8 w-full max-w-sm px-3 text-sm sm:h-9"
        />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isMultiSelectMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssign}
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <span className="sm:hidden">{t("assign")}</span>
            <span className="hidden sm:inline">{t("assign_to_branch")}</span>
          </Button>
        )}
        <Button size="sm" onClick={() => setFormOpen(true)} className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
          <span className="sm:hidden">{t("new")}</span>
          <span className="hidden sm:inline">{t("new_item")}</span>
        </Button>
      </div>
    </div>
  )

  const emptyState = hasSearch ? (
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
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        totalCount={data?.totalCount ?? 0}
        onPageChange={setPage}
        toolbar={toolbar}
        emptyMessage={emptyState}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        skeletonRows={10}
        labels={{
          previous: t("previous"),
          next: t("next"),
          selected: t("selected"),
          paginationTotal: (count) => t("pagination_total", { count }),
        }}
      />

      {/* Form Dialog */}
      <ItemFormDialog open={formOpen} onOpenChange={handleDialogClose} itemToEdit={itemToEdit} />
    </div>
  )
}
