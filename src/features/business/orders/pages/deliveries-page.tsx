import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { ArrowLeft, Bike, CheckCircle2, Phone, RefreshCw, Send, UserPlus, Users } from "lucide-react"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useAssignCourier, useDeliveryBoard } from "../hooks/use-couriers"
import { useUpdateOrderStatus } from "../hooks/use-orders"
import { CourierPickerDialog } from "../components/courier-picker-dialog"
import { DeliveryOrderCard } from "../components/delivery-order-card"
import type { DeliveryCourierGroup, DeliveryOrder } from "../types/delivery"
import { getApiErrorMessage } from "../utils/order-helpers"

/** Clave de localStorage para recordar la sucursal consultada (compartida con Órdenes). */
const ORDERS_BRANCH_STORAGE_KEY = "business.orders.branchId"
const ALL_BRANCHES = "__ALL__"
const COL_READY = "Ready"
const COL_SHIPPED = "Shipped"

type PickerState =
  | { mode: "assign"; order: DeliveryOrder; courierId: string | null }
  | { mode: "dispatch"; order: DeliveryOrder; courierId: string | null }
  | null

/**
 * Domicilios: asignación (Listo → En camino con domiciliario) y vista por
 * domiciliario (qué lleva, qué entregó y cuánto tiene por cobrar).
 */
export function DeliveriesPage() {
  const { t } = useTranslation("business-orders")
  const navigate = useNavigate()
  const { formatCurrency } = useLocaleFormat()

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ORDERS_BRANCH_STORAGE_KEY)
    } catch {
      return null
    }
  })
  const { data: branchesData } = useBranches(1, 50)
  const branches = useMemo(() => branchesData?.data ?? [], [branchesData])
  const showAllBranches = !selectedBranchId || selectedBranchId === ALL_BRANCHES
  const branchId = showAllBranches ? null : branches.some((b) => b.id === selectedBranchId) ? selectedBranchId : null

  const handleBranchChange = (id: string | null) => {
    const value = id ?? ALL_BRANCHES
    try {
      localStorage.setItem(ORDERS_BRANCH_STORAGE_KEY, value)
    } catch {
      // Sin almacenamiento local la selección vive solo en memoria.
    }
    setSelectedBranchId(value)
  }

  const [tab, setTab] = useState<"assign" | "route">("assign")
  const [date, setDate] = useState<string>("")
  const [courierFilter, setCourierFilter] = useState<string>("__ALL__")
  const { data: board, isLoading, refetch, isFetching } = useDeliveryBoard(branchId, date || null)

  // Reloj para los minutos transcurridos (se actualiza cada 30 s).
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const updateStatus = useUpdateOrderStatus()
  const assignCourier = useAssignCourier()
  const [picker, setPicker] = useState<PickerState>(null)

  // Índices para la vista de asignación (siempre del día de hoy).
  const { readyOrders, shippedOrders, courierOf } = useMemo(() => {
    const ready: DeliveryOrder[] = [...(board?.unassigned ?? [])]
    const shipped: DeliveryOrder[] = []
    const owner = new Map<string, DeliveryCourierGroup>()
    for (const group of board?.couriers ?? []) {
      for (const order of group.orders) {
        owner.set(order.id, group)
        if (order.status === "Ready") ready.push(order)
        else if (order.status === "Shipped") shipped.push(order)
      }
    }
    ready.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    shipped.sort((a, b) => (a.dispatchedAt ?? "").localeCompare(b.dispatchedAt ?? ""))
    return { readyOrders: ready, shippedOrders: shipped, courierOf: owner }
  }, [board])

  const onError = (error: unknown) => notify.error(getApiErrorMessage(error, t("status_update_failed")))

  const dispatch = (order: DeliveryOrder, courierId: string | null) => {
    updateStatus.mutate(
      { id: order.id, status: "Shipped", courierId },
      {
        onSuccess: () => {
          setPicker(null)
          notify.success(t("delivery_dispatched"))
        },
        onError,
      }
    )
  }

  const markDelivered = (order: DeliveryOrder) => {
    updateStatus.mutate(
      { id: order.id, status: "Delivered" },
      { onSuccess: () => notify.success(t("delivery_delivered")), onError }
    )
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.source.droppableId !== COL_READY || result.destination.droppableId !== COL_SHIPPED) return
    const order = readyOrders.find((o) => o.id === result.draggableId)
    if (!order) return
    // Siempre se confirma el domiciliario al enviar (preseleccionado si ya tiene).
    setPicker({ mode: "dispatch", order, courierId: courierOf.get(order.id)?.courierId ?? null })
  }

  const handlePickerConfirm = (courierId: string | null) => {
    if (!picker) return
    if (picker.mode === "dispatch") {
      dispatch(picker.order, courierId)
      return
    }
    assignCourier.mutate(
      { orderId: picker.order.id, courierId },
      {
        onSuccess: () => {
          setPicker(null)
          notify.success(courierId ? t("courier_assigned") : t("courier_unassigned_ok"))
        },
        onError,
      }
    )
  }

  const routeGroups = (board?.couriers ?? []).filter(
    (g) => courierFilter === "__ALL__" || g.courierId === courierFilter
  )
  const totalPending = (board?.couriers ?? []).reduce((acc, g) => acc + g.pendingToCollect, 0)

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("orders")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("deliveries_title")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("deliveries_desc")}</p>
          <Bike
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <BranchSelector
            options={[
              { id: null, name: t("all_branches") },
              ...branches.map((b) => ({ id: b.id as string | null, name: b.name })),
            ]}
            selectedId={branchId}
            onSelect={handleBranchChange}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/business/orders")}>
              <ArrowLeft className="mr-2 size-4" />
              {t("orders")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/business/orders/couriers")}>
              <Users className="mr-2 size-4" />
              {t("couriers_title")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Figure label={t("deliveries_to_assign")} value={String(board?.unassigned.length ?? 0)} accent />
          <Figure label={t("shipped")} value={String(shippedOrders.length)} />
          <Figure
            label={t("delivered")}
            value={String((board?.couriers ?? []).reduce((acc, g) => acc + g.deliveredCount, 0))}
          />
          <Figure label={t("deliveries_pending_collect")} value={formatCurrency(totalPending)} />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "assign" | "route")} className="mt-4">
          <TabsList className="max-w-full flex-wrap gap-1">
            <TabsTrigger value="assign" className="gap-1.5">
              <Send className="size-3.5" />
              {t("deliveries_tab_assign")}
            </TabsTrigger>
            <TabsTrigger value="route" className="gap-1.5">
              <Bike className="size-3.5" />
              {t("deliveries_tab_route")}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              {/* ── Asignación: Listo → En camino ── */}
              <TabsContent value="assign" className="mt-4">
                {date && <p className="mb-3 text-xs text-muted-foreground">{t("deliveries_assign_today_only")}</p>}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <BoardColumn
                      id={COL_READY}
                      title={t("ready")}
                      tone="success"
                      count={readyOrders.length}
                      hint={t("deliveries_drag_hint")}
                    >
                      {readyOrders.map((order, index) => {
                        const group = courierOf.get(order.id)
                        return (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style as CSSProperties}
                                className={snapshot.isDragging ? "opacity-90 shadow-md" : ""}
                              >
                                <DeliveryOrderCard
                                  order={order}
                                  now={now}
                                  showBranch={showAllBranches}
                                  courierName={group?.name ?? null}
                                  actions={
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                          setPicker({ mode: "assign", order, courierId: group?.courierId ?? null })
                                        }
                                      >
                                        <UserPlus className="mr-1 size-3.5" />
                                        {group ? t("courier_reassign") : t("courier_assign")}
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                          setPicker({ mode: "dispatch", order, courierId: group?.courierId ?? null })
                                        }
                                      >
                                        <Send className="mr-1 size-3.5" />
                                        {t("delivery_dispatch")}
                                      </Button>
                                    </>
                                  }
                                />
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                    </BoardColumn>

                    <BoardColumn
                      id={COL_SHIPPED}
                      title={t("shipped")}
                      tone="primary"
                      count={shippedOrders.length}
                      hint={t("deliveries_shipped_hint")}
                    >
                      {shippedOrders.map((order) => (
                        <DeliveryOrderCard
                          key={order.id}
                          order={order}
                          now={now}
                          showBranch={showAllBranches}
                          courierName={courierOf.get(order.id)?.name ?? null}
                          actions={
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setPicker({
                                    mode: "assign",
                                    order,
                                    courierId: courierOf.get(order.id)?.courierId ?? null,
                                  })
                                }
                              >
                                <UserPlus className="mr-1 size-3.5" />
                                {t("courier_reassign")}
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => markDelivered(order)}
                                disabled={updateStatus.isPending}
                              >
                                <CheckCircle2 className="mr-1 size-3.5" />
                                {t("delivery_mark_delivered")}
                              </Button>
                            </>
                          }
                        />
                      ))}
                    </BoardColumn>
                  </div>
                </DragDropContext>
              </TabsContent>

              {/* ── Vista de domicilios: por domiciliario ── */}
              <TabsContent value="route" className="mt-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="sm:w-64">
                    <Select value={courierFilter} onValueChange={setCourierFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{t("couriers_all")}</SelectItem>
                        {(board?.couriers ?? []).map((g) => (
                          <SelectItem key={g.courierId} value={g.courierId}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    {t("deliveries_date")}
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-9 w-auto"
                      max={board?.date}
                    />
                  </label>
                  {date && (
                    <Button variant="ghost" size="sm" onClick={() => setDate("")}>
                      {t("deliveries_today")}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground sm:ml-auto">
                    {t("timezone")}: {board?.timeZone}
                  </span>
                </div>

                {routeGroups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("deliveries_route_empty")}</p>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {routeGroups.map((group) => (
                      <CourierRouteCard
                        key={group.courierId}
                        group={group}
                        now={now}
                        showBranch={showAllBranches}
                        isPending={updateStatus.isPending}
                        onDispatch={(order) => dispatch(order, group.courierId)}
                        onDelivered={markDelivered}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        <CourierPickerDialog
          open={picker !== null}
          onOpenChange={(open) => !open && setPicker(null)}
          branchId={picker?.order.branchId ?? null}
          title={picker?.mode === "dispatch" ? t("delivery_dispatch_title") : t("courier_assign_title")}
          description={
            picker
              ? [`#${picker.order.reference}`, picker.order.customerName, formatCurrency(picker.order.total)]
                  .filter(Boolean)
                  .join(" · ")
              : undefined
          }
          confirmLabel={picker?.mode === "dispatch" ? t("delivery_dispatch") : t("courier_assign")}
          defaultCourierId={picker?.courierId ?? null}
          allowNone={picker?.mode === "assign" && picker.order.status === "Ready"}
          isPending={updateStatus.isPending || assignCourier.isPending}
          onConfirm={handlePickerConfirm}
        />
      </CardContent>
    </Card>
  )
}

function BoardColumn({
  id,
  title,
  tone,
  count,
  hint,
  children,
}: {
  id: string
  title: string
  tone: "success" | "primary"
  count: number
  hint: string
  children: React.ReactNode
}) {
  const { t } = useTranslation("business-orders")
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Badge tone={tone}>{count}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
      <Droppable droppableId={id} isDropDisabled={id === COL_READY}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
          >
            {count === 0 && <p className="py-8 text-center text-xs text-muted-foreground">{t("no_orders")}</p>}
            {children}
            {provided.placeholder}
          </CardContent>
        )}
      </Droppable>
    </Card>
  )
}

function CourierRouteCard({
  group,
  now,
  showBranch,
  isPending,
  onDispatch,
  onDelivered,
}: {
  group: DeliveryCourierGroup
  now: number
  showBranch: boolean
  isPending: boolean
  onDispatch: (order: DeliveryOrder) => void
  onDelivered: (order: DeliveryOrder) => void
}) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  // En camino primero, luego listos y al final los entregados.
  const rank: Record<string, number> = { Shipped: 0, Ready: 1, Delivered: 2 }
  const orders = [...group.orders].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 truncate text-base font-semibold">
              <Bike className="size-4 shrink-0 text-primary" />
              {group.name}
            </CardTitle>
            {group.phone && (
              <a
                href={`tel:${group.phone}`}
                className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-3" />
                {group.phone}
              </a>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {t("deliveries_pending_collect")}
            </p>
            <p className="text-base font-bold text-primary tabular-nums">{formatCurrency(group.pendingToCollect)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          <Badge tone="success" className="text-[10px]">
            {t("ready")} {group.readyCount}
          </Badge>
          <Badge tone="primary" className="text-[10px]">
            {t("shipped")} {group.onTheWayCount}
          </Badge>
          <Badge tone="neutral" className="text-[10px]">
            {t("delivered")} {group.deliveredCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.map((order) => (
          <DeliveryOrderCard
            key={order.id}
            order={order}
            now={now}
            showBranch={showBranch}
            showStatus
            actions={
              order.status === "Ready" ? (
                <Button size="sm" className="h-7 text-xs" onClick={() => onDispatch(order)} disabled={isPending}>
                  <Send className="mr-1 size-3.5" />
                  {t("delivery_dispatch")}
                </Button>
              ) : order.status === "Shipped" ? (
                <Button size="sm" className="h-7 text-xs" onClick={() => onDelivered(order)} disabled={isPending}>
                  <CheckCircle2 className="mr-1 size-3.5" />
                  {t("delivery_mark_delivered")}
                </Button>
              ) : undefined
            }
          />
        ))}
      </CardContent>
    </Card>
  )
}

function Figure({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 text-center">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={`text-base font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  )
}
