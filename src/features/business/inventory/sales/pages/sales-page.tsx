import { useState } from "react"
import { Banknote, Plus, TrendingUp } from "lucide-react"

import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { InventoryPagination } from "../../components/inventory-pagination"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useSales, useSalesStats } from "../../hooks/use-sales"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import { formatDateTime } from "../../utils/status"
import { formatMoney } from "../../utils/units"
import { NewSaleDialog } from "../components/new-sale-dialog"
import { SaleDetailDialog } from "../components/sale-detail-dialog"

/** Ventas a empleados desde el backoffice: salen del inventario de la sucursal y queda la ganancia. */
export function SalesPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [saleId, setSaleId] = useState<string | null>(null)
  const { data, isLoading } = useSales(branchId, page)
  const stats = useSalesStats(branchId)
  const rows = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/inventory", label: t("back_to_inventory") }}
        title={t("sales")}
        description={t("sales_page_desc")}
        stats={
          branchId
            ? [
                {
                  icon: Banknote,
                  tone: "primary",
                  label: t("stat_sales_total"),
                  value: stats.data ? formatMoney(stats.data.totalSold) : "—",
                },
                {
                  icon: TrendingUp,
                  tone: "success",
                  label: t("sale_profit"),
                  value: stats.data ? formatMoney(stats.data.profit) : "—",
                },
              ]
            : undefined
        }
        tabs={
          branchesLoading ? (
            <Skeleton className="h-10 w-80" />
          ) : branches.length === 0 ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              <BranchSelector
                options={branches.map((b) => ({ id: b.id, name: b.name }))}
                selectedId={branchId}
                onSelect={(id) => {
                  if (!id) return
                  selectBranch(id)
                  setPage(1)
                }}
              />
              {branch?.isSupplier ? <Badge tone="primary">{t("supplier_branch")}</Badge> : null}
            </div>
          )
        }
        toolbar={
          branchesLoading || branches.length === 0
            ? undefined
            : {
                actions: (
                  <Button id="btn-nueva-venta" type="button" onClick={() => setCreating(true)}>
                    <Plus className="mr-2 size-4" />
                    {t("sale_new_title")}
                  </Button>
                ),
              }
        }
      >
        {/* El Card del layout recorta: la tabla hace su propio scroll. */}
        {branch ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("sales_empty")}</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("document")}</TableHead>
                        <TableHead>{t("sale_customer")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead className="text-right">{t("sale_total")}</TableHead>
                        <TableHead className="text-right">{t("sale_profit")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((s) => (
                        <TableRow key={s.id} className="cursor-pointer" onClick={() => setSaleId(s.id)}>
                          <TableCell className="font-medium text-foreground">{s.number}</TableCell>
                          <TableCell>{s.customerName ?? t("sale_customer_none")}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(s.createdAt)}</TableCell>
                          <TableCell className="text-right">{formatMoney(s.total)}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(s.profit)}
                            {s.profitPercent !== null ? (
                              <p className="text-xs text-muted-foreground">{s.profitPercent} %</p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {s.status === "Voided" ? (
                              <Badge tone="danger">{t("receipt_voided")}</Badge>
                            ) : (
                              <Badge tone="success">{t("sale_status_applied")}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : branches.length === 0 && !branchesLoading ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : null}
      </EntityListLayout>

      {branch && creating ? (
        <NewSaleDialog
          branch={branch}
          onOpenChange={setCreating}
          onCreated={(sale) => {
            setCreating(false)
            setSaleId(sale.id)
          }}
        />
      ) : null}
      {saleId ? <SaleDetailDialog saleId={saleId} onOpenChange={(open) => !open && setSaleId(null)} /> : null}
    </>
  )
}
