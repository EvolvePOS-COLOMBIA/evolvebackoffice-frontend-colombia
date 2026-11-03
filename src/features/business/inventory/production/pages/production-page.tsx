import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CalendarClock, ChefHat } from "lucide-react"

import { BackLink } from "@/components/ui/back-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranchModules } from "@/features/business/branches/hooks/use-branch-modules"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { InventoryPagination } from "../../components/inventory-pagination"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useProductionOrders } from "../../hooks/use-production"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { ProductionOrderDto } from "../../types/production"
import { formatDateTime, PRODUCTION_MODULE, PRODUCTION_STATUS_TONE } from "../../utils/status"
import { formatMoney, formatQuantity } from "../../utils/units"
import { ProduceDialog } from "../components/produce-dialog"
import { ProductionDetailDialog } from "../components/production-detail-dialog"

type Tab = "done" | "planned"

/** Producción: lo que se hizo (con su costo real) y las órdenes preparadas por hacer. */
export function ProductionPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const { data: modules, isLoading: modulesLoading } = useBranchModules(branchId)
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("tab") === "planned" ? "planned" : "done"))
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ mode: "produce" | "plan"; fromPlan?: ProductionOrderDto } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const hasModule = (modules ?? []).some((m) => m.moduleCode === PRODUCTION_MODULE && m.isEnabled)
  const { data, isLoading } = useProductionOrders({
    branchId: hasModule ? branchId : null,
    status: tab === "planned" ? "Planned" : "done",
    pageNumber: page,
  })
  const rows = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackLink to="/business/inventory">{t("back_to_inventory")}</BackLink>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("production")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("production_page_desc")}</p>
          <ChefHat
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
            <BranchSelector
              options={branches.map((b) => ({ id: b.id, name: b.name }))}
              selectedId={branchId}
              onSelect={(id) => {
                if (!id) return
                selectBranch(id)
                setPage(1)
              }}
            />
            {hasModule ? (
              <div className="flex flex-wrap gap-2">
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
            ) : null}
          </div>
        )}

        {branch && modulesLoading ? <Skeleton className="h-48 w-full" /> : null}
        {branch && !modulesLoading && !hasModule ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("production_no_module", { branch: branch.name })}
          </p>
        ) : null}

        {branch && hasModule ? (
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as Tab)
              setPage(1)
            }}
          >
            <TabsList>
              <TabsTrigger value="done">{t("production_tab_done")}</TabsTrigger>
              <TabsTrigger value="planned">{t("production_tab_planned")}</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {tab === "planned" ? t("production_empty_planned") : t("production_empty")}
                </p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("document")}</TableHead>
                        <TableHead>{t("production_products")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead className="text-right">{t("value")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}>
                          <TableCell className="font-medium text-foreground">{r.number}</TableCell>
                          <TableCell>
                            <ul className="space-y-0.5">
                              {r.products.map((p) => (
                                <li key={p.itemId}>
                                  {p.itemName}{" "}
                                  <span className="text-muted-foreground">
                                    · {formatQuantity(p.producedQuantity ?? p.plannedQuantity, p.baseUnit)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(r.completedAt ?? r.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === "Planned" ? "—" : formatMoney(r.totalCost)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={PRODUCTION_STATUS_TONE[r.status]}>{t(`production_status_${r.status}`)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </Tabs>
        ) : null}

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
      </CardContent>
    </Card>
  )
}
