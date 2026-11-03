import { useState } from "react"
import { Plus, Receipt } from "lucide-react"

import { BackLink } from "@/components/ui/back-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { InventoryPagination } from "../../components/inventory-pagination"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useSales } from "../../hooks/use-sales"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import { formatDateTime } from "../../utils/status"
import { formatMoney } from "../../utils/units"
import { NewSaleDialog } from "../components/new-sale-dialog"
import { SaleDetailDialog } from "../components/sale-detail-dialog"

/** Ventas a clientes o negocios desde el backoffice (p. ej. el CP le vende pan a otro restaurante). */
export function SalesPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [saleId, setSaleId] = useState<string | null>(null)
  const { data, isLoading } = useSales(branchId, page)
  const rows = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackLink to="/business/inventory">{t("back_to_inventory")}</BackLink>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("sales")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("sales_page_desc")}</p>
          <Receipt
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        {branchesLoading ? (
          <Skeleton className="h-10 w-80" />
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <Button id="btn-nueva-venta" type="button" onClick={() => setCreating(true)}>
              <Plus className="mr-2 size-4" />
              {t("sale_new_title")}
            </Button>
          </div>
        )}

        {branch ? (
          isLoading ? (
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
          )
        ) : null}
        <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
      </CardContent>
    </Card>
  )
}
