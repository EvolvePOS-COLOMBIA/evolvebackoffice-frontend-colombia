import { useState } from "react"
import { Pencil, Trash2, Package, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      deleteBranchItem.mutate(item.id)
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
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="mb-3 size-10 opacity-40" />
          <p className="text-sm">{t("no_branch_items")}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 rounded-lg border">
          <Table containerClassName="h-full" className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 min-w-[150px]">{t("name")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-[100px] sm:table-cell">{t("sku")}</TableHead>
                <TableHead className="sticky top-0 z-10 min-w-[100px] text-right">{t("price")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-[100px] text-right md:table-cell">
                  {t("sale_price")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-[100px] text-right md:table-cell">
                  {t("cost")}
                </TableHead>
                <TableHead className="sticky top-0 z-10 min-w-[80px] text-right">{t("stock")}</TableHead>
                <TableHead className="sticky top-0 z-10 hidden min-w-[80px] lg:table-cell">{t("status")}</TableHead>
                <TableHead className="sticky top-0 z-10 w-28 text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
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
              ))}
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
