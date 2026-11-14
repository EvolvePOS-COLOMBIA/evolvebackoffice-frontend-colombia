import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CalendarClock, ChefHat, CircleDollarSign, SearchX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranchModules } from "@/features/business/branches/hooks/use-branch-modules"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { useInventoryInbox } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useProductionOrders, useProductionStats } from "../../hooks/use-production"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { ProductionOrderDto } from "../../types/production"
import { PRODUCTION_MODULE } from "../../utils/status"
import { formatMoney } from "../../utils/units"
import { ProduceDialog } from "../components/produce-dialog"
import { ProductionDetailDialog } from "../components/production-detail-dialog"
import { buildProductionColumns } from "../components/production-columns"
import { filterProductionOrders } from "../utils/search"

type Tab = "done" | "planned"

/** Producción: lo que se hizo (con su costo real) y las órdenes preparadas por hacer. */
export function ProductionPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const { data: modules, isLoading: modulesLoading } = useBranchModules(branchId)
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("tab") === "planned" ? "planned" : "done"))
  // Búsqueda client-side: filtra los ítems ya cargados porque el backend no
  // expone parámetro de búsqueda. Al escribir se vuelve a la página 1.
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ mode: "produce" | "plan"; fromPlan?: ProductionOrderDto } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const hasModule = (modules ?? []).some((m) => m.moduleCode === PRODUCTION_MODULE && m.isEnabled)
  const { data, isLoading } = useProductionOrders({
    branchId: hasModule ? branchId : null,
    status: tab === "planned" ? "Planned" : "done",
    pageNumber: page,
  })
  // Histórico completo de la sucursal (el endpoint pagina y no expone totales).
  const productionStats = useProductionStats(branchId)
  // Bandeja del servidor: son agregados reales de la sucursal, no se suman desde la página.
  const { data: inbox } = useInventoryInbox(branchId)
  const rows = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)
  // Con filtro activo la tabla colapsa a los coincidentes de la página cargada:
  // el pie deja de contar el total del servidor y la paginación se oculta.
  const isFiltering = search.trim().length > 0
  const items = filterProductionOrders(rows, search)

  const changeTab = (value: string) => {
    setTab(value as Tab)
    setPage(1)
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/inventory", label: t("back_to_inventory") }}
        title={t("production")}
        description={t("production_page_desc")}
        stats={
          branchId && hasModule
            ? [
                {
                  icon: ChefHat,
                  tone: "primary",
                  label: t("stat_productions"),
                  value: productionStats.data ? productionStats.data.totalCount : "—",
                },
                {
                  icon: CalendarClock,
                  tone: "warning",
                  label: t("stat_planned"),
                  value: inbox?.plannedProductions ?? "—",
                },
                {
                  icon: CircleDollarSign,
                  tone: "success",
                  label: t("stat_production_cost"),
                  value: productionStats.data ? formatMoney(productionStats.data.totalCost) : "—",
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
            </div>
          )
        }
        heroFooter={
          branch && hasModule ? (
            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList>
                <TabsTrigger value="done">{t("production_tab_done")}</TabsTrigger>
                <TabsTrigger value="planned">{t("production_tab_planned")}</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : undefined
        }
        toolbar={
          branch && hasModule
            ? {
                search: {
                  value: search,
                  onChange: (value) => {
                    setSearch(value)
                    setPage(1)
                  },
                  placeholder: t("search_productions"),
                },
                actions: (
                  <div className="flex w-fit shrink-0 items-center gap-2">
                    <Button
                      id="btn-producir"
                      type="button"
                      variant="outline"
                      onClick={() => setDialog({ mode: "produce" })}
                    >
                      <ChefHat className="mr-2 size-4" />
                      {t("production_produce")}
                    </Button>
                    <Button id="btn-preparar-produccion" type="button" onClick={() => setDialog({ mode: "plan" })}>
                      <CalendarClock className="mr-2 size-4" />
                      {t("production_plan_title")}
                    </Button>
                  </div>
                ),
              }
            : undefined
        }
      >
        {/* El Card del layout recorta: la tabla hace su propio scroll. */}
        {branch && modulesLoading ? <Skeleton className="h-48 w-full" /> : null}
        {branch && !modulesLoading && !hasModule ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("production_no_module", { branch: branch.name })}
          </p>
        ) : null}
        {branch && hasModule ? (
          <DataTable
            columns={buildProductionColumns(t, { onOpen: (order) => setDetailId(order.id) })}
            data={items}
            isLoading={isLoading}
            page={page}
            totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
            totalCount={isFiltering ? items.length : (data?.totalCount ?? 0)}
            onPageChange={setPage}
            skeletonRows={6}
            minWidth="min-w-[680px]"
            emptyState={
              isFiltering
                ? { icon: SearchX, title: t("production_no_results"), description: t("production_no_results_desc") }
                : tab === "done"
                  ? {
                      icon: ChefHat,
                      title: t("production_empty"),
                      description: t("production_empty_desc"),
                      action: (
                        <Button type="button" onClick={() => setDialog({ mode: "produce" })}>
                          <ChefHat className="size-4" />
                          {t("production_produce")}
                        </Button>
                      ),
                    }
                  : {
                      icon: CalendarClock,
                      title: t("production_empty_planned"),
                      description: t("production_empty_planned_desc"),
                      action: (
                        <Button type="button" onClick={() => setDialog({ mode: "plan" })}>
                          <CalendarClock className="size-4" />
                          {t("production_plan_title")}
                        </Button>
                      ),
                    }
            }
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) =>
                tab === "done" ? t("production_count", { count }) : t("production_planned_count", { count }),
              paginationProgress: (count, total) =>
                tab === "done"
                  ? t("production_progress", { count, total })
                  : t("production_planned_progress", { count, total }),
            }}
          />
        ) : null}
        {!branch && branches.length === 0 && !branchesLoading ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : null}
      </EntityListLayout>

      {branch && dialog ? (
        <ProduceDialog
          branch={branch}
          mode={dialog.mode}
          fromPlan={dialog.fromPlan}
          onOpenChange={(open) => !open && setDialog(null)}
          onDone={(order) => {
            setDialog(null)
            setTab(order.status === "Planned" ? "planned" : "done")
            setDetailId(order.id)
          }}
        />
      ) : null}
      {detailId && !dialog ? (
        <ProductionDetailDialog
          productionId={detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
          onComplete={(order) => {
            setDetailId(null)
            setDialog({ mode: "produce", fromPlan: order })
          }}
        />
      ) : null}
    </>
  )
}
