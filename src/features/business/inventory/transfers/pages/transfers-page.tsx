import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, PackageCheck, SearchX, Send, ShoppingCart, Truck } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useTranslation } from "@/i18n/use-i18n"
import { useInventoryInbox } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { usePurchaseOrders, useTransfers } from "../../hooks/use-purchasing"
import { NewOrderDialog } from "../../purchase-orders/components/new-order-dialog"
import { OrderDetailDialog } from "../../purchase-orders/components/order-detail-dialog"
import { buildOrderColumns } from "../../purchase-orders/components/purchase-orders-columns"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import { buildTransferColumns } from "../components/transfers-columns"
import { NewTransferDialog } from "../components/new-transfer-dialog"
import { TransferDetailDialog } from "../components/transfer-detail-dialog"
import { filterTransferOrders, filterTransfers } from "../utils/search"

/** requested = lo que pedí · requests = lo que me piden · shipments = envíos que salen y llegan. */
type Tab = "requested" | "requests" | "shipments"
type ShipmentFilter = "incoming" | "outgoing" | "differences"

const SHIPMENT_FILTERS: ShipmentFilter[] = ["incoming", "outgoing", "differences"]

/** Lee ?tab= (también los enlaces viejos: ?tab=incoming|outgoing|differences). */
function initialView(params: URLSearchParams): { tab: Tab; filter: ShipmentFilter } {
  const tab = params.get("tab")
  const filter = params.get("filter")
  if (tab === "requested" || tab === "requests") return { tab, filter: "incoming" }
  if (SHIPMENT_FILTERS.includes(tab as ShipmentFilter)) return { tab: "shipments", filter: tab as ShipmentFilter }
  return {
    tab: tab === "shipments" ? "shipments" : "requested",
    filter: SHIPMENT_FILTERS.includes(filter as ShipmentFilter) ? (filter as ShipmentFilter) : "incoming",
  }
}

/**
 * Transferencia entre sucursales: pedir a otra sucursal, despachar lo que me piden,
 * enviar sin pedido y recibir lo que llega. Arriba, lo que esta sucursal tiene por atender.
 */
export function TransfersPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => initialView(searchParams).tab)
  const [filter, setFilter] = useState<ShipmentFilter>(() => initialView(searchParams).filter)
  const [openOnly, setOpenOnly] = useState(true)
  // Búsqueda client-side: filtra los ítems ya cargados porque el backend no
  // expone parámetro de búsqueda. Al escribir se vuelve a la página 1.
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState<"order" | "transfer" | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [transferId, setTransferId] = useState<string | null>(null)

  const { data: inbox } = useInventoryInbox(branchId)
  const orders = usePurchaseOrders({
    branchId: tab === "shipments" ? null : branchId,
    direction: tab === "requests" ? "incoming" : "outgoing",
    kind: "internal",
    status: openOnly ? "open" : undefined,
    pageNumber: page,
  })
  const transfers = useTransfers({
    branchId: tab === "shipments" ? branchId : null,
    direction: filter === "incoming" ? "incoming" : "outgoing",
    status: filter === "differences" ? "differences" : undefined,
    pageNumber: page,
  })
  const current = tab === "shipments" ? transfers : orders
  const totalPages = Math.ceil((current.data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)
  // Con filtro activo la tabla colapsa a los coincidentes de la página cargada:
  // el pie deja de contar el total del servidor y la paginación se oculta.
  const isFiltering = search.trim().length > 0
  const orderItems = filterTransferOrders(orders.data?.items ?? [], search)
  const transferItems = filterTransfers(transfers.data?.items ?? [], search)

  // Sin pedido: la proveedora le envía a cualquiera; las demás solo a una proveedora.
  const canSend = Boolean(
    branch && branches.some((b) => b.id !== branch.id && b.isActive && (branch.isSupplier || b.isSupplier))
  )

  const show = (nextTab: Tab, nextFilter?: ShipmentFilter) => {
    setTab(nextTab)
    if (nextFilter) setFilter(nextFilter)
    setPage(1)
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/inventory", label: t("back_to_inventory") }}
        title={t("transfers")}
        description={t("transfers_page_desc")}
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
        stats={
          branch
            ? [
                {
                  icon: Truck,
                  tone: "info",
                  label: t("transfers_attention_dispatch"),
                  value: inbox?.ordersToDispatch ?? 0,
                },
                {
                  icon: PackageCheck,
                  tone: "info",
                  label: t("transfers_attention_receive"),
                  value: inbox?.transfersToReceive ?? 0,
                },
                {
                  icon: AlertTriangle,
                  tone: "warning",
                  label: t("transfers_attention_differences"),
                  value: inbox?.differencesToResolve ?? 0,
                },
              ]
            : undefined
        }
        heroFooter={
          branchId ? (
            <Tabs value={tab} onValueChange={(value) => show(value as Tab)}>
              <TabsList>
                <TabsTrigger value="requested">{t("transfers_tab_requested")}</TabsTrigger>
                <TabsTrigger value="requests">{t("transfers_tab_requests")}</TabsTrigger>
                <TabsTrigger value="shipments">{t("transfers_tab_shipments")}</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : undefined
        }
        toolbar={
          branch
            ? {
                search: {
                  value: search,
                  onChange: (value) => {
                    setSearch(value)
                    setPage(1)
                  },
                  placeholder: tab === "shipments" ? t("search_transfers_shipments") : t("search_transfers_orders"),
                },
                actions: (
                  <div className="flex flex-wrap items-center gap-4">
                    {tab === "shipments" ? (
                      <Select value={filter} onValueChange={(value) => show("shipments", value as ShipmentFilter)}>
                        <SelectTrigger id="envios-filtro" className="sm:w-80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="incoming">{t("transfers_filter_incoming")}</SelectItem>
                          <SelectItem value="outgoing">{t("transfers_filter_outgoing")}</SelectItem>
                          <SelectItem value="differences">{t("transfers_filter_differences")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="transferencias-pendientes"
                          checked={openOnly}
                          onCheckedChange={(checked) => {
                            setOpenOnly(checked)
                            setPage(1)
                          }}
                        />
                        <Label htmlFor="transferencias-pendientes">{t("transfers_open_only")}</Label>
                      </div>
                    )}
                    <Button
                      id="btn-pedir-productos"
                      type="button"
                      variant="outline"
                      onClick={() => setCreating("order")}
                    >
                      <ShoppingCart className="mr-2 size-4" />
                      {t("transfers_action_request")}
                    </Button>
                    <Button
                      id="btn-enviar-productos"
                      type="button"
                      disabled={!canSend}
                      onClick={() => setCreating("transfer")}
                    >
                      <Send className="mr-2 size-4" />
                      {t("transfers_action_send")}
                    </Button>
                  </div>
                ),
              }
            : undefined
        }
      >
        {branches.length === 0 ? (
          branchesLoading ? null : (
            <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
          )
        ) : branchId === null ? null : tab === "requested" ? (
          <DataTable
            columns={buildOrderColumns(t, {
              counterpartLabel: t("transfers_asked_to"),
              counterpart: "supplier",
              onOpen: (order) => setOrderId(order.id),
            })}
            data={orderItems}
            isLoading={orders.isLoading}
            page={page}
            totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
            totalCount={isFiltering ? orderItems.length : (orders.data?.totalCount ?? 0)}
            onPageChange={setPage}
            skeletonRows={6}
            minWidth="min-w-[680px]"
            emptyState={
              isFiltering
                ? {
                    icon: SearchX,
                    title: t("transfers_orders_no_results"),
                    description: t("transfers_orders_no_results_desc"),
                  }
                : { icon: ShoppingCart, title: t("transfers_requested_empty") }
            }
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("transfers_orders_count", { count }),
              paginationProgress: (count, total) => t("transfers_orders_progress", { count, total }),
            }}
          />
        ) : tab === "requests" ? (
          <DataTable
            columns={buildOrderColumns(t, {
              counterpartLabel: t("order_requested_by"),
              counterpart: "branch",
              onOpen: (order) => setOrderId(order.id),
            })}
            data={orderItems}
            isLoading={orders.isLoading}
            page={page}
            totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
            totalCount={isFiltering ? orderItems.length : (orders.data?.totalCount ?? 0)}
            onPageChange={setPage}
            skeletonRows={6}
            minWidth="min-w-[680px]"
            emptyState={
              isFiltering
                ? {
                    icon: SearchX,
                    title: t("transfers_orders_no_results"),
                    description: t("transfers_orders_no_results_desc"),
                  }
                : { icon: ShoppingCart, title: t("transfers_requests_empty") }
            }
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("transfers_orders_count", { count }),
              paginationProgress: (count, total) => t("transfers_orders_progress", { count, total }),
            }}
          />
        ) : (
          <DataTable
            columns={buildTransferColumns(t, { onOpen: (transfer) => setTransferId(transfer.id) })}
            data={transferItems}
            isLoading={transfers.isLoading}
            page={page}
            totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
            totalCount={isFiltering ? transferItems.length : (transfers.data?.totalCount ?? 0)}
            onPageChange={setPage}
            skeletonRows={6}
            minWidth="min-w-[720px]"
            emptyState={
              isFiltering
                ? {
                    icon: SearchX,
                    title: t("transfers_shipments_no_results"),
                    description: t("transfers_shipments_no_results_desc"),
                  }
                : { icon: Truck, title: t("transfers_empty") }
            }
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("transfers_count", { count }),
              paginationProgress: (count, total) => t("transfers_progress", { count, total }),
            }}
          />
        )}
      </EntityListLayout>

      {branch && creating === "order" ? (
        <NewOrderDialog
          kind="branch"
          branch={branch}
          branches={branches}
          onOpenChange={(open) => !open && setCreating(null)}
          onCreated={(order) => {
            setCreating(null)
            show("requested")
            setOrderId(order.id)
          }}
        />
      ) : null}
      {branch && creating === "transfer" ? (
        <NewTransferDialog
          branch={branch}
          branches={branches}
          onOpenChange={(open) => !open && setCreating(null)}
          onCreated={(transfer) => {
            setCreating(null)
            show("shipments", "outgoing")
            setTransferId(transfer.id)
          }}
        />
      ) : null}
      {branchId && orderId ? (
        <OrderDetailDialog
          orderId={orderId}
          branchId={branchId}
          onOpenChange={(open) => !open && setOrderId(null)}
          onOpenTransfer={(id) => {
            setOrderId(null)
            setTransferId(id)
          }}
        />
      ) : null}
      {branchId && transferId ? (
        <TransferDetailDialog
          transferId={transferId}
          branchId={branchId}
          onOpenChange={(open) => !open && setTransferId(null)}
        />
      ) : null}
    </>
  )
}
