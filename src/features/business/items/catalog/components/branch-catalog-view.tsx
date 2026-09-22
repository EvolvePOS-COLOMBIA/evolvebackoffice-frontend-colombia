import { useState } from "react"
import { Pencil, Trash2, Settings, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@/components/data-table"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranchItems, useDeleteBranchItem } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"
import { BranchItemFormDialog } from "./branch-item-form-dialog"
import { AdjustStockDialog } from "./adjust-stock-dialog"

type BranchCatalogViewProps = {
  branchId: string
  onAssignClick: () => void
}

function StockBadge({ quantity, reorderPoint }: { quantity: number | null; reorderPoint: number | null }) {
  const qty = quantity ?? 0
  const reorder = reorderPoint ?? 0
  const isLow = qty <= reorder

  return (
    <Badge tone={isLow ? "danger" : "neutral"} className="font-mono text-xs">
      {qty}
    </Badge>
  )
}

export function BranchCatalogView({ branchId, onAssignClick }: BranchCatalogViewProps) {
  const { t } = useTranslation("business-items-catalog")
  const [page, setPage] = useState(1)
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BranchItemResponseDto | null>(null)

  const { data, isLoading } = useBranchItems(branchId, { pageNumber: page, pageSize: 20 })
  const deleteBranchItem = useDeleteBranchItem(branchId)

  const items = data?.data ?? []

  const handleEditPricing = (item: BranchItemResponseDto) => {
    setSelectedItem(item)
    setPricingDialogOpen(true)
  }

  const handleAdjustStock = (item: BranchItemResponseDto) => {
    setSelectedItem(item)
    setStockDialogOpen(true)
  }

  const handleDelete = (item: BranchItemResponseDto) => {
    if (confirm(t("confirm_remove_from_branch", { name: item.itemName }))) {
      deleteBranchItem.mutate({ id: item.id, name: item.itemName ?? "" })
    }
  }

  const handlePricingDialogClose = () => {
    setPricingDialogOpen(false)
    setSelectedItem(null)
  }

  const handleStockDialogClose = () => {
    setStockDialogOpen(false)
    setSelectedItem(null)
  }

  const columns: ColumnDef<BranchItemResponseDto>[] = [
    {
      key: "name",
      header: t("name"),
      responsive: "always",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{item.itemName}</p>
          {item.binLocation && (
            <p className="text-xs text-muted-foreground">
              {t("bin")}: {item.binLocation}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "sku",
      header: t("sku"),
      responsive: "sm",
      render: (item) => <span className="text-muted-foreground">{item.itemSku ?? "—"}</span>,
    },
    {
      key: "price",
      header: t("price"),
      align: "right",
      render: (item) => <span className="font-medium">${(item.price ?? 0).toLocaleString("es-CO")}</span>,
    },
    {
      key: "salePrice",
      header: t("sale_price"),
      responsive: "md",
      align: "right",
      render: (item) => <span>${(item.salePrice ?? 0).toLocaleString("es-CO")}</span>,
    },
    {
      key: "cost",
      header: t("cost"),
      responsive: "md",
      align: "right",
      render: (item) => <span className="text-muted-foreground">${(item.cost ?? 0).toLocaleString("es-CO")}</span>,
    },
    {
      key: "stock",
      header: t("stock"),
      align: "right",
      render: (item) => <StockBadge quantity={item.quantity} reorderPoint={item.reorderPoint} />,
    },
    {
      key: "status",
      header: t("status"),
      responsive: "lg",
      render: (item) => (
        <Badge tone={item.inactive ? "neutral" : "success"}>{item.inactive ? t("inactive") : t("active")}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (item) => (
        <div className="flex justify-end gap-1 sm:gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => handleEditPricing(item)}
            aria-label={t("edit_pricing")}
          >
            <Settings className="size-3.5 sm:size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => handleAdjustStock(item)}
            aria-label={t("adjust_stock")}
          >
            <Pencil className="size-3.5 sm:size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="size-7 text-destructive sm:size-8"
            onClick={() => handleDelete(item)}
            aria-label={t("remove_from_branch")}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const toolbar = (
    <div className="flex items-center justify-end">
      <Button size="sm" onClick={onAssignClick} className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
        <span className="sm:hidden">{t("assign")}</span>
        <span className="hidden sm:inline">{t("assign_products")}</span>
      </Button>
    </div>
  )

  const emptyState = (
    <>
      <Package className="mb-2 size-8 opacity-40 sm:mb-3 sm:size-10" />
      <p className="text-xs sm:text-sm">{t("no_branch_items")}</p>
      <Button variant="outline" size="sm" className="mt-3 h-8 px-2 text-xs sm:mt-4" onClick={onAssignClick}>
        <span className="sm:hidden">{t("assign")}</span>
        <span className="hidden sm:inline">{t("assign_products")}</span>
      </Button>
    </>
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        totalCount={data?.totalCount ?? 0}
        onPageChange={setPage}
        toolbar={toolbar}
        emptyMessage={emptyState}
        skeletonRows={8}
        labels={{
          previous: t("previous"),
          next: t("next"),
          paginationTotal: (count) => t("branch_items_count", { count }),
        }}
      />

      {/* Pricing Dialog */}
      {selectedItem && (
        <BranchItemFormDialog
          open={pricingDialogOpen}
          onOpenChange={handlePricingDialogClose}
          branchId={branchId}
          item={selectedItem}
        />
      )}

      {/* Adjust Stock Dialog */}
      {selectedItem && (
        <AdjustStockDialog open={stockDialogOpen} onOpenChange={handleStockDialogClose} item={selectedItem} />
      )}
    </div>
  )
}
