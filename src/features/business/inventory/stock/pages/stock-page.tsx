import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, Package, PackageX, SearchX, X } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { useInventoryInbox, useStock } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { StockItemDto } from "../../types"
import { MarginsTable } from "../components/margins-table"
import { MovementsTable } from "../components/movements-table"
import { buildStockColumns } from "../components/stock-columns"
import { SetQuantityDialog, WriteoffDialog } from "../components/stock-dialogs"

type StockAction = "writeoff" | "correction"

/** Existencias de una sucursal: qué hay, cuánto vale y qué está bajo el mínimo. */
export function StockPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  // Los avisos de la portada abren esta pantalla ya filtrada (?filter=below-min | negative) o en ?tab=margins.
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(() => (searchParams.get("tab") === "margins" ? "margins" : "stock"))
  const [search, setSearch] = useState("")
  const [belowMin, setBelowMin] = useState(() => searchParams.get("filter") === "below-min")
  const [negative, setNegative] = useState(() => searchParams.get("filter") === "negative")
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<{ type: StockAction; item: StockItemDto } | null>(null)
  const [historyItem, setHistoryItem] = useState<StockItemDto | null>(null)

  const { data, isLoading } = useStock({ branchId, search, belowMin, negative, pageNumber: page })
  // Conteos de la sucursal completa: no dependen de la página ni de los filtros.
  const { data: inbox } = useInventoryInbox(branchId)
  const items = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  const changeBranch = (id: string | null) => {
    if (!id) return
    selectBranch(id)
    setPage(1)
    setHistoryItem(null)
  }

  const openHistory = (item: StockItemDto) => {
    setHistoryItem(item)
    setTab("movements")
  }

  const closeAction = () => setAction(null)

  const hasFilters = Boolean(search || belowMin || negative)

  const stockColumns = buildStockColumns(t, {
    onHistory: openHistory,
    onWriteoff: (item) => setAction({ type: "writeoff", item }),
    onCorrection: (item) => setAction({ type: "correction", item }),
  })

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/inventory", label: t("back_to_inventory") }}
        title={t("stock_title")}
        description={t("stock_desc")}
        tabs={
          branchesLoading ? (
            <Skeleton className="h-10 w-80" />
          ) : branches.length === 0 ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              <BranchSelector
                options={branches.map((b) => ({ id: b.id, name: b.name }))}
                selectedId={branchId}
                onSelect={changeBranch}
              />
              {branch?.isSupplier ? <Badge tone="primary">{t("supplier_branch")}</Badge> : null}
            </div>
          )
        }
        stats={
          branchId
            ? [
                {
                  icon: Package,
                  tone: "primary",
                  label: t("stat_products"),
                  value: data?.totalCount ?? 0,
                },
                {
                  icon: AlertTriangle,
                  tone: "warning",
                  label: t("stat_below_min"),
                  value: inbox?.belowMinCount ?? 0,
                },
                {
                  icon: PackageX,
                  tone: "danger",
                  label: t("stat_negative"),
                  value: inbox?.negativeCount ?? 0,
                },
              ]
            : undefined
        }
        heroFooter={
          branchId ? (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="stock">{t("tab_stock")}</TabsTrigger>
                <TabsTrigger value="movements">{t("tab_movements")}</TabsTrigger>
                <TabsTrigger value="margins">{t("tab_margins")}</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : undefined
        }
        toolbar={
          branchId && tab === "stock"
            ? {
                search: {
                  value: search,
                  onChange: (value) => {
                    setSearch(value)
                    setPage(1)
                  },
                  placeholder: t("search_products"),
                },
                actions: (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="existencias-bajo-minimo"
                        checked={belowMin}
                        onCheckedChange={(checked) => {
                          setBelowMin(checked)
                          setPage(1)
                        }}
                      />
                      <Label htmlFor="existencias-bajo-minimo">{t("below_min_only")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="existencias-negativos"
                        checked={negative}
                        onCheckedChange={(checked) => {
                          setNegative(checked)
                          setPage(1)
                        }}
                      />
                      <Label htmlFor="existencias-negativos">{t("negative_only")}</Label>
                    </div>
                  </div>
                ),
              }
            : undefined
        }
      >
        {/* Cada pestaña maneja su propio scroll: el Card del layout recorta lo que sobresalga. */}
        {branches.length === 0 ? (
          branchesLoading ? null : (
            <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
          )
        ) : branchId === null ? null : tab === "stock" ? (
          <DataTable
            columns={stockColumns}
            data={items}
            page={page}
            totalPages={totalPages}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            isLoading={isLoading}
            skeletonRows={5}
            emptyState={{
              icon: hasFilters ? SearchX : Package,
              title: hasFilters ? t("no_stock_filtered") : t("no_stock"),
            }}
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("stock_count", { count }),
            }}
          />
        ) : tab === "movements" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            {historyItem ? (
              <div className="flex items-center gap-2">
                <Badge tone="info">{historyItem.itemName}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setHistoryItem(null)}>
                  <X className="size-4" />
                  {t("show_all")}
                </Button>
              </div>
            ) : null}
            <MovementsTable branchId={branchId} itemId={historyItem?.itemId} />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {branch ? <MarginsTable key={branch.id} branch={branch} /> : null}
          </div>
        )}
      </EntityListLayout>

      {branchId && action?.type === "writeoff" ? (
        <WriteoffDialog
          key={action.item.branchItemId}
          branchId={branchId}
          item={action.item}
          onOpenChange={closeAction}
        />
      ) : null}
      {branchId && action?.type === "correction" ? (
        <SetQuantityDialog
          key={action.item.branchItemId}
          branchId={branchId}
          item={action.item}
          onOpenChange={closeAction}
        />
      ) : null}
    </>
  )
}
