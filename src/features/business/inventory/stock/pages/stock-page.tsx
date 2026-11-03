import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CircleEllipsis, ClipboardCheck, History, PackageMinus, Search, Warehouse, X } from "lucide-react"

import { BackLink } from "@/components/ui/back-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { InventoryPagination } from "../../components/inventory-pagination"
import { useStock } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { StockItemDto } from "../../types"
import { formatInPackaging, formatMoney, formatQuantity, formatUnitCost, unitSymbol } from "../../utils/units"
import { MarginsTable } from "../components/margins-table"
import { MovementsTable } from "../components/movements-table"
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

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackLink to="/business/inventory">{t("back_to_inventory")}</BackLink>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("stock_title")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("stock_desc")}</p>
          <Warehouse
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        {branchesLoading ? (
          <Skeleton className="h-10 w-80" />
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <BranchSelector
              options={branches.map((b) => ({ id: b.id, name: b.name }))}
              selectedId={branchId}
              onSelect={changeBranch}
            />
            {branch?.isSupplier ? <Badge tone="primary">{t("supplier_branch")}</Badge> : null}
          </div>
        )}

        {branchId ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="stock">{t("tab_stock")}</TabsTrigger>
              <TabsTrigger value="movements">{t("tab_movements")}</TabsTrigger>
              <TabsTrigger value="margins">{t("tab_margins")}</TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-sm">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="existencias-buscar"
                    placeholder={t("search_products")}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9"
                  />
                </div>
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
              </div>

              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : items.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {search || belowMin || negative ? t("no_stock_filtered") : t("no_stock")}
                </p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("product")}</TableHead>
                        <TableHead className="text-right">{t("on_hand")}</TableHead>
                        <TableHead className="hidden text-right md:table-cell">{t("avg_cost")}</TableHead>
                        <TableHead className="text-right">{t("value")}</TableHead>
                        <TableHead className="hidden text-right md:table-cell">{t("min_short")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.branchItemId}>
                          <TableCell>
                            <p className="font-medium text-foreground">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {[item.sku, item.departmentName].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p
                              className={
                                item.quantity < 0 ? "font-medium text-destructive" : "font-medium text-foreground"
                              }
                            >
                              {formatQuantity(item.quantity, item.baseUnit)}
                            </p>
                            {formatInPackaging(item.quantity, item.defaultPackaging) ? (
                              <p className="text-xs text-muted-foreground">
                                {formatInPackaging(item.quantity, item.defaultPackaging)}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                            {formatUnitCost(item.cost)} / {unitSymbol(item.baseUnit)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">{formatMoney(item.value)}</TableCell>
                          <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                            {item.reorderPoint > 0 ? formatQuantity(item.reorderPoint, item.baseUnit) : "—"}
                          </TableCell>
                          <TableCell>
                            <StockStatus item={item} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon-sm" aria-label={t("actions")}>
                                  <CircleEllipsis className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onSelect={() => openHistory(item)}>
                                  <History className="size-4" />
                                  {t("action_history")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setAction({ type: "writeoff", item })}>
                                  <PackageMinus className="size-4" />
                                  {t("action_writeoff")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setAction({ type: "correction", item })}>
                                  <ClipboardCheck className="size-4" />
                                  {t("action_correction")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t("stock_count", { count: data?.totalCount ?? 0 })}</p>
                <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="margins" className="space-y-4">
              {branch ? <MarginsTable key={branch.id} branch={branch} /> : null}
            </TabsContent>
          </Tabs>
        ) : null}

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
      </CardContent>
    </Card>
  )
}

function StockStatus({ item }: { item: StockItemDto }) {
  const { t } = useTranslation("business-inventory")
  if (item.quantity < 0) return <Badge tone="danger">{t("status_negative")}</Badge>
  if (item.isBelowMin) return <Badge tone="warning">{t("status_below_min")}</Badge>
  return <Badge tone="success">{t("status_ok")}</Badge>
}
