import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, ArrowRightLeft, PackageCheck, Send, ShoppingCart, Truck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { BackLink } from "@/components/ui/back-link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Card className="overflow-hidden shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackLink to="/business/inventory">{t("back_to_inventory")}</BackLink>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("transfers")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("transfers_page_desc")}</p>
          <ArrowRightLeft
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
              onSelect={(id) => {
                if (!id) return
                selectBranch(id)
                setPage(1)
              }}
            />
            {branch?.isSupplier ? <Badge tone="primary">{t("supplier_branch")}</Badge> : null}
          </div>
        )}

        {branch ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionTile
                id="btn-pedir-productos"
                icon={ShoppingCart}
                title={t("transfers_action_request")}
                description={t("transfers_action_request_desc")}
                onClick={() => setCreating("order")}
              />
              <ActionTile
                id="btn-enviar-productos"
                icon={Send}
                title={t("transfers_action_send")}
                description={
                  branch.isSupplier ? t("transfers_action_send_desc_supplier") : t("transfers_action_send_desc")
                }
                disabled={!canSend}
                onClick={() => setCreating("transfer")}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("transfers_attention")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <AttentionTile
                  icon={Truck}
                  count={inbox?.ordersToDispatch ?? 0}
                  label={t("transfers_attention_dispatch")}
                  onClick={() => {
                    setOpenOnly(true)
                    show("requests")
                  }}
                />
                <AttentionTile
                  icon={PackageCheck}
                  count={inbox?.transfersToReceive ?? 0}
                  label={t("transfers_attention_receive")}
                  onClick={() => show("shipments", "incoming")}
                />
                <AttentionTile
                  icon={AlertTriangle}
                  count={inbox?.differencesToResolve ?? 0}
                  label={t("transfers_attention_differences")}
                  tone="warning"
                  onClick={() => show("shipments", "differences")}
                />
              </div>
            </div>

            <Tabs value={tab} onValueChange={(value) => show(value as Tab)}>
              <TabsList>
                <TabsTrigger value="requested">{t("transfers_tab_requested")}</TabsTrigger>
                <TabsTrigger value="requests">{t("transfers_tab_requests")}</TabsTrigger>
                <TabsTrigger value="shipments">{t("transfers_tab_shipments")}</TabsTrigger>
              </TabsList>

              <TabsContent value="requested" className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("transfers_requested_hint")}</p>
                <OpenOnlySwitch
                  checked={openOnly}
                  onChange={(checked) => {
                    setOpenOnly(checked)
                    setPage(1)
                  }}
                />
                <DataTable
                  columns={buildOrderColumns(t, {
                    counterpartLabel: t("transfers_asked_to"),
                    counterpart: "supplier",
                    onOpen: (order) => setOrderId(order.id),
                  })}
                  data={orders.data?.items ?? []}
                  isLoading={orders.isLoading}
                  page={page}
                  totalPages={Math.max(1, totalPages)}
                  totalCount={orders.data?.totalCount ?? 0}
                  onPageChange={setPage}
                  skeletonRows={6}
                  minWidth="min-w-[680px]"
                  emptyState={{ icon: ShoppingCart, title: t("transfers_requested_empty") }}
                  labels={{
                    previous: t("previous"),
                    next: t("next"),
                    paginationTotal: (count) => t("transfers_orders_count", { count }),
                    paginationProgress: (count, total) => t("transfers_orders_progress", { count, total }),
                  }}
                />
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("transfers_requests_hint")}</p>
                <OpenOnlySwitch
                  checked={openOnly}
                  onChange={(checked) => {
                    setOpenOnly(checked)
                    setPage(1)
                  }}
                />
                <DataTable
                  columns={buildOrderColumns(t, {
                    counterpartLabel: t("order_requested_by"),
                    counterpart: "branch",
                    onOpen: (order) => setOrderId(order.id),
                  })}
                  data={orders.data?.items ?? []}
                  isLoading={orders.isLoading}
                  page={page}
                  totalPages={Math.max(1, totalPages)}
                  totalCount={orders.data?.totalCount ?? 0}
                  onPageChange={setPage}
                  skeletonRows={6}
                  minWidth="min-w-[680px]"
                  emptyState={{ icon: ShoppingCart, title: t("transfers_requests_empty") }}
                  labels={{
                    previous: t("previous"),
                    next: t("next"),
                    paginationTotal: (count) => t("transfers_orders_count", { count }),
                    paginationProgress: (count, total) => t("transfers_orders_progress", { count, total }),
                  }}
                />
              </TabsContent>

              <TabsContent value="shipments" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Label htmlFor="envios-filtro">{t("transfers_show")}</Label>
                  <Select value={filter} onValueChange={(value) => show("shipments", value as ShipmentFilter)}>
                    <SelectTrigger id="envios-filtro" className="sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">{t("transfers_filter_incoming")}</SelectItem>
                      <SelectItem value="outgoing">{t("transfers_filter_outgoing")}</SelectItem>
                      <SelectItem value="differences">{t("transfers_filter_differences")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DataTable
                  columns={buildTransferColumns(t, { onOpen: (transfer) => setTransferId(transfer.id) })}
                  data={transfers.data?.items ?? []}
                  isLoading={transfers.isLoading}
                  page={page}
                  totalPages={Math.max(1, totalPages)}
                  totalCount={transfers.data?.totalCount ?? 0}
                  onPageChange={setPage}
                  skeletonRows={6}
                  minWidth="min-w-[720px]"
                  emptyState={{ icon: Truck, title: t("transfers_empty") }}
                  labels={{
                    previous: t("previous"),
                    next: t("next"),
                    paginationTotal: (count) => t("transfers_count", { count }),
                    paginationProgress: (count, total) => t("transfers_progress", { count, total }),
                  }}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : null}

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
      </CardContent>
    </Card>
  )
}

/** Botón grande de acción: "Pedir productos" / "Enviar productos". */
function ActionTile({
  id,
  icon: Icon,
  title,
  description,
  disabled = false,
  onClick,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/35 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 sm:p-5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

/** Contador de lo que la sucursal tiene por atender; al tocarlo muestra la lista. */
function AttentionTile({
  icon: Icon,
  count,
  label,
  tone = "info",
  onClick,
}: {
  icon: LucideIcon
  count: number
  label: string
  tone?: "info" | "warning"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/45 p-3 text-left transition-colors hover:border-primary/40"
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      {count > 0 ? <Badge tone={tone}>{count}</Badge> : <span className="text-sm text-muted-foreground">0</span>}
    </button>
  )
}

function OpenOnlySwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const { t } = useTranslation("business-inventory")
  return (
    <div className="flex items-center gap-2">
      <Switch id="transferencias-pendientes" checked={checked} onCheckedChange={onChange} />
      <Label htmlFor="transferencias-pendientes">{t("transfers_open_only")}</Label>
    </div>
  )
}
