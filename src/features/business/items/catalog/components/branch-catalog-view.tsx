import { useState } from "react"
import { Pencil, Trash2, Package, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranchItems, useDeleteBranchItem } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"
import { BranchItemFormDialog } from "./branch-item-form-dialog"
import { AdjustStockDialog } from "./adjust-stock-dialog"

type BranchCatalogViewProps = {
  branchId: string
  onAssignClick: () => void
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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("branch_items_count", { count: data?.totalCount ?? 0 })}</p>
        <Button size="sm" onClick={onAssignClick}>
          {t("assign_product")}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <BranchTableSkeleton />
      ) : (
        <div className="min-h-0 flex-1 rounded-lg border">
          <Table containerClassName="h-full" className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 min-w-37.5">{t("name")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 sm:table-cell">{t("sku")}</TableHead>
                <TableHead className="sticky top-0 z-10 min-w-25 text-right">{t("price")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 text-right md:table-cell">
                  {t("sale_price")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-25 text-right md:table-cell">
                  {t("cost")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 min-w-20 text-right">{t("stock")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-20 lg:table-cell">{t("status")}</TableHead>
                <TableHead className="sticky top-0 z-10 w-28 text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="mb-3 size-10 opacity-40" />
                      <p className="text-sm">{t("no_branch_items")}</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={onAssignClick}>
                        {t("assign_products")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.itemName}</p>
                        {item.binLocation && (
                          <p className="text-xs text-muted-foreground">
                            {t("bin")}: {item.binLocation}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{item.itemSku ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">${item.price.toLocaleString("es-CO")}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      ${item.salePrice.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                      ${item.cost.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockBadge quantity={item.quantity} reorderPoint={item.reorderPoint} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge tone={item.inactive ? "neutral" : "success"}>
                        {item.inactive ? t("inactive") : t("active")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEditPricing(item)}
                          aria-label={t("edit_pricing")}
                        >
                          <Settings className="size-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8"
                          onClick={() => handleAdjustStock(item)}
                          aria-label={t("adjust_stock")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDelete(item)}
                          aria-label={t("remove_from_branch")}
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
