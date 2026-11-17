import { useState } from "react"
import { Banknote, Plus, TrendingUp } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useSales, useSalesStats } from "../../hooks/use-sales"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import { formatMoney } from "../../utils/units"
import { NewSaleDialog } from "../components/new-sale-dialog"
import { SaleDetailDialog } from "../components/sale-detail-dialog"
import { buildSaleColumns } from "../components/sales-columns"

/** Ventas a empleados desde el backoffice: salen del inventario de la sucursal y queda la ganancia. */
export function SalesPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [saleId, setSaleId] = useState<string | null>(null)
  const { data, isLoading } = useSales(branchId, page, search)
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
                search: {
                  value: search,
                  onChange: (value) => {
                    setSearch(value)
                    setPage(1)
                  },
                  placeholder: t("search_sales"),
                },
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
          <DataTable
            columns={buildSaleColumns(t, { onView: (sale) => setSaleId(sale.id) })}
            data={rows}
            isLoading={isLoading}
            page={page}
            totalPages={Math.max(1, totalPages)}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            skeletonRows={6}
            minWidth="min-w-[680px]"
            emptyState={{
              icon: Banknote,
              title: t("sales_empty"),
              description: t("sales_empty_desc"),
              action: (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="size-4" />
                  {t("sale_new_title")}
                </Button>
              ),
            }}
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("sales_count", { count }),
              paginationProgress: (count, total) => t("sales_progress", { count, total }),
            }}
          />
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
