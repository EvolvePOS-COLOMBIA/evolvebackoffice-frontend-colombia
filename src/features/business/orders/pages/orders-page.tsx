import { useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/i18n/use-i18n"
import { useNotify } from "@/hooks/use-notify"
import Spinner from "@/components/Spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RefreshCw, Truck, Store, ShoppingCart, AlertTriangle, Plus, Lock, Bike, Ban } from "lucide-react"
import { useQueries } from "@tanstack/react-query"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import {
  branchModulesKeys,
  useBranchModules,
  useTenantModules,
} from "@/features/business/branches/hooks/use-branch-modules"
import { getBranchModules } from "@/features/business/branches/services/branch-modules.service"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useBranchIntegrations } from "@/features/business/branches/hooks/use-branch-integrations"
import { useOrders, useUpdateOrderStatus } from "../hooks/use-orders"
import { useOrderUpdates } from "../hooks/use-order-updates"
import { OrdersKanban } from "../components/orders-kanban"
import { BulkOrderStatusDialog } from "../components/bulk-order-status-dialog"
import { MAX_BULK_ORDERS } from "../utils/bulk-status"
import { OrderDetailDialog } from "../components/order-detail-dialog"
import { CancelOrderDialog } from "../components/cancel-order-dialog"
import { ManualOrderDialog } from "../components/manual-order-dialog"
import { EditOrderDialog } from "../components/edit-order-dialog"
import { CourierPickerDialog } from "../components/courier-picker-dialog"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import { checkOrderStock } from "../services/orders.service"
import type { OrderListItem, OrderStatus, OrderStockItem } from "../types/api"

type PlatformFilter = "all" | "CLUVI" | "WOOCOMMERCE" | "POSCO"

/** Clave de localStorage para recordar la sucursal consultada en Órdenes. */
const ORDERS_BRANCH_STORAGE_KEY = "business.orders.branchId"

/**
 * Página principal de gestión de pedidos en tablero Kanban.
 * Incluye filtrado por sucursal, plataforma de origen, verificación de stock,
 * asignación de domiciliarios, cancelación granular y operaciones por lote.
 */
export function OrdersPage() {
  const { t } = useTranslation("business-orders")
  const navigate = useNavigate()
  const notify = useNotify()
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all")
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: "", ids: [] })
  const [bulkRequest, setBulkRequest] = useState<{ orders: OrderListItem[]; status?: OrderStatus } | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState<OrderListItem | null>(null)
  const [showCancelled, setShowCancelled] = useState(false)

  // Sucursal consultada: selección visible con persistencia local.
  // (Antes se tomaba branches[0] a ciegas y no se veía cuál era.)
  // "__ALL__" = todas las sucursales (como el catálogo global de artículos).
  const ALL_BRANCHES = "__ALL__"
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() =>
    localStorage.getItem(ORDERS_BRANCH_STORAGE_KEY)
  )
  const showAllBranches = selectedBranchId === ALL_BRANCHES
  const { data: branchesData } = useBranches(1, 50)
  const branches = branchesData?.data ?? []

  // Módulos de cada sucursal (misma query key que useBranchModules → caché compartida)
  const moduleQueries = useQueries({
    queries: branches.map((b) => ({
      queryKey: branchModulesKeys.list(b.id),
      queryFn: () => getBranchModules(b.id),
      staleTime: 60_000,
    })),
  })
  // Solo sucursales con el módulo ORDERS activo se muestran en el selector
  const branchesWithOrdersModule = branches.filter(
    (_, i) => moduleQueries[i]?.data?.some((m) => m.moduleCode === "ORDERS" && m.isEnabled) ?? false
  )

  const branchId = showAllBranches
    ? ""
    : selectedBranchId && branchesWithOrdersModule.some((b) => b.id === selectedBranchId)
      ? selectedBranchId
      : (branchesWithOrdersModule[0]?.id ?? "")

  /** Cambia la sucursal activa seleccionada o selecciona todas las sucursales. */
  const handleBranchChange = (id: string | null) => {
    // null = "Todas las sucursales"
    const value = id ?? ALL_BRANCHES
    localStorage.setItem(ORDERS_BRANCH_STORAGE_KEY, value)
    setSelectedBranchId(value)
    setSelection({ scope: "", ids: [] })
  }

  const { data: branchModules } = useBranchModules(branchId)
  const hasOrdersModule = showAllBranches
    ? branchesWithOrdersModule.length > 0
    : branchModules?.some((m) => m.moduleCode === "ORDERS" && m.isEnabled)

  const { data: integrations } = useBranchIntegrations(branchId)

  // La configuración de Cluvi solo se expone si el módulo CLUVI está
  // habilitado para el tenant (licencia dada de baja en la consola de plataforma).
  const { data: tenantModules = [], isLoading: tenantModulesLoading } = useTenantModules()
  const hasCluviModule = !tenantModulesLoading && tenantModules.some((m) => m.moduleCode === "CLUVI" && m.isEnabled)

  /** Estado de una integración en la sucursal seleccionada. */
  const integrationState = (platform: string): "active" | "configured" | "none" => {
    if (!branchId) return "none"
    const row = integrations?.find((i) => i.platformCode === platform)
    if (!row) return "none"
    return row.isActive ? "active" : "configured"
  }

  // enabled=!!branchId: no se pide órdenes sin sucursal (evita una petición sin filtrar mientras carga la lista)
  // En "todas" se pide sin branchId (el backend devuelve todas las sucursales).
  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useOrders(1, 100, branchId ? { branchId } : undefined, !!branchId || showAllBranches)
  // Pedidos nuevos o actualizados (webhook de Cluvi, otro usuario) aparecen sin recargar.
  useOrderUpdates(branchId)
  const updateStatusMutation = useUpdateOrderStatus()

  // Memoizado para que los useMemo dependientes (filtros/conteos) no se
  // recalculen en cada render por una referencia nueva.
  const allOrders = useMemo(() => ordersData?.data ?? [], [ordersData])

  const filteredOrders = useMemo(() => {
    if (platformFilter === "all") return allOrders
    return allOrders.filter((o) => o.platformCode === platformFilter)
  }, [allOrders, platformFilter])

  const selectionScope = `${branchId}:${showAllBranches}:${platformFilter}`
  const selectableOrders = filteredOrders.filter(
    (order) => order.statusCode !== "Delivered" && KANBAN_COLUMNS.some((status) => status === order.statusCode)
  )
  const visibleIds = new Set(selectableOrders.map((order) => order.id))
  const selectedIds = new Set(
    selection.scope === selectionScope ? selection.ids.filter((id) => visibleIds.has(id)) : []
  )
  /** Alterna la selección de una lista de identificadores de órdenes para acciones por lote. */
  const toggleSelection = (ids: string[]) => {
    const next = new Set(selectedIds)
    if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id))
    else {
      ids.forEach((id) => {
        if (next.size < MAX_BULK_ORDERS) next.add(id)
      })
      if (ids.some((id) => !next.has(id))) notify.error(t("bulk_limit", { count: MAX_BULK_ORDERS }))
    }
    setSelection({ scope: selectionScope, ids: [...next] })
  }
  const selectedOrders = selectableOrders.filter((order) => selectedIds.has(order.id))

  const cancelledOrdersCount = useMemo(
    () => filteredOrders.filter((o) => o.statusCode === "Cancelled").length,
    [filteredOrders]
  )

  const kanbanStatusKeys = useMemo(
    () => (showCancelled ? ([...KANBAN_COLUMNS, "Cancelled"] as const) : KANBAN_COLUMNS),
    [showCancelled]
  )

  const ordersByStatus = kanbanStatusKeys.reduce(
    (acc, status) => {
      acc[status] = filteredOrders.filter((o) => o.statusCode === status)
      return acc
    },
    {} as Record<string, OrderListItem[]>
  )

  const platformCounts = useMemo(
    () => ({
      all: allOrders.length,
      CLUVI: allOrders.filter((o) => o.platformCode === "CLUVI").length,
      WOOCOMMERCE: allOrders.filter((o) => o.platformCode === "WOOCOMMERCE").length,
      POSCO: allOrders.filter((o) => o.platformCode === "POSCO").length,
    }),
    [allOrders]
  )

  const [stockWarning, setStockWarning] = useState<OrderStockItem[] | null>(null)
  // Pedido a domicilio soltado en "En camino": se pide el domiciliario antes de enviarlo.
  const [dispatchOrder, setDispatchOrder] = useState<OrderListItem | null>(null)
  const pendingConfirmRef = useRef<{ orderId: string; status: OrderStatus } | null>(null)

  /** Aplica un cambio de estado a una orden y opcionalmente asigna un repartidor. */
  const applyStatus = (orderId: string, newStatus: OrderStatus, courierId?: string | null) => {
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus, courierId },
      {
        onSuccess: () => {
          setDispatchOrder(null)
          notify.success(t("status") + " → " + (ORDER_STATUS_CONFIG[newStatus]?.label ?? newStatus))
        },
        onError: (error: unknown) => {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
          notify.error(message || t("status_update_failed"))
        },
      }
    )
  }

  /**
   * Al pasar la orden a "Confirmado" se consulta el inventario de la sucursal.
   * Si falta stock se muestra la advertencia y el usuario decide: nunca se
   * bloquea la orden, solo se avisa antes de enviar el cambio.
   */
  const handleDragEnd = async (orderId: string, newStatus: OrderStatus) => {
    if (bulkRequest || updateStatusMutation.isPending) return
    // Cancelar requiere seleccionar tipo de disposición (Restocked / Waste) y motivo individualizado
    if (newStatus === "Cancelled") {
      const order = allOrders.find((o) => o.id === orderId)
      if (order) setCancellingOrder(order)
      return
    }
    if (selectedIds.has(orderId) && selectedOrders.length > 1) {
      setBulkRequest({ orders: selectedOrders, status: newStatus })
      return
    }
    // Un pedido a domicilio no sale sin domiciliario: se elige (o confirma) al enviarlo.
    if (newStatus === "Shipped") {
      const order = allOrders.find((o) => o.id === orderId)
      if (order?.shippingStreet) {
        setDispatchOrder(order)
        return
      }
    }
    if (newStatus === "Confirmed") {
      try {
        const check = await checkOrderStock(orderId)
        if (check.hasShortage) {
          pendingConfirmRef.current = { orderId, status: newStatus }
          setStockWarning(check.items.filter((item) => !item.sufficient))
          return
        }
      } catch {
        // Sin verificación no se bloquea el movimiento.
      }
    }
    applyStatus(orderId, newStatus)
  }

  /** Confirma el cambio de estado a pesar de existir advertencia de inventario insuficiente. */
  const handleConfirmDespiteShortage = () => {
    const pending = pendingConfirmRef.current
    pendingConfirmRef.current = null
    setStockWarning(null)
    if (pending) applyStatus(pending.orderId, pending.status)
  }

  /** Abre el modal con el detalle completo de la orden seleccionada. */
  const handleViewDetail = (order: OrderListItem) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  /** Navega a la pestaña de integración de la sucursal en Sucursales. */
  const goToIntegration = (tab: "cluvi" | "woocommerce") => {
    if (!branchId) return
    navigate(`/business/branches/${branchId}/config?tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("orders")}</h1>
          <p className="text-muted-foreground">{t("orders_desc")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <span className="hidden text-sm text-muted-foreground md:inline">{t("viewing_branch")}</span>
          <BranchSelector
            options={[
              { id: null, name: t("all_branches") },
              ...branchesWithOrdersModule.map((b) => ({ id: b.id as string | null, name: b.name })),
            ]}
            selectedId={showAllBranches ? null : branchId || null}
            onSelect={handleBranchChange}
          />
          <Button size="sm" onClick={() => setCreateOrderOpen(true)} disabled={!branchId}>
            <Plus className="mr-2 h-4 w-4" />
            {t("create_order")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/business/orders/deliveries")}>
            <Bike className="mr-2 h-4 w-4" />
            {t("deliveries_entry")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/business/orders/closing")}>
            <Lock className="mr-2 h-4 w-4" />
            {t("closing_entry")}
          </Button>
          {hasCluviModule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToIntegration("cluvi")}
              disabled={!hasOrdersModule || showAllBranches}
              title={integrationTitle(integrationState("CLUVI"), t)}
            >
              <Truck className="mr-2 h-4 w-4" />
              Cluvi
              {!showAllBranches && <StatusDot state={integrationState("CLUVI")} />}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToIntegration("woocommerce")}
            disabled={!hasOrdersModule || showAllBranches}
            title={integrationTitle(integrationState("WOOCOMMERCE"), t)}
          >
            <Store className="mr-2 h-4 w-4" />
            WooCommerce
            {!showAllBranches && <StatusDot state={integrationState("WOOCOMMERCE")} />}
          </Button>
        </div>
      </div>

      {/* Warning if ORDERS module not active */}
      {!hasOrdersModule && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t("orders_module_warning_title")}</p>
              <p className="text-xs text-amber-700">{t("orders_module_warning_desc")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros de plataforma + kanban/lista */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Platform Filter Tabs */}
        <Tabs
          value={platformFilter}
          onValueChange={(v) => {
            setPlatformFilter(v as PlatformFilter)
            setSelection({ scope: "", ids: [] })
          }}
        >
          <TabsList className="max-w-full flex-wrap gap-1">
            <TabsTrigger value="all" className="gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Todas
              <Badge tone="neutral" className="ml-1 text-[10px]">
                {platformCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="POSCO" className="gap-1.5">
              Local
              <Badge tone="neutral" className="ml-1 text-[10px]">
                {platformCounts.POSCO}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="CLUVI" className="gap-1.5">
              Cluvi
              <Badge tone="neutral" className="ml-1 text-[10px]">
                {platformCounts.CLUVI}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="WOOCOMMERCE" className="gap-1.5">
              WooCommerce
              <Badge tone="neutral" className="ml-1 text-[10px]">
                {platformCounts.WOOCOMMERCE}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Botón para ver/ocultar órdenes canceladas */}
        <Button
          variant={showCancelled ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowCancelled(!showCancelled)}
          className="gap-1.5"
        >
          <Ban className="size-3.5 text-destructive" />
          <span>{showCancelled ? t("hide_cancelled_orders") : t("show_cancelled_orders")}</span>
          <Badge tone="neutral" className="ml-0.5 text-[10px]">
            {cancelledOrdersCount}
          </Badge>
        </Button>
      </div>

      {selectableOrders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!!bulkRequest || updateStatusMutation.isPending}
            onClick={() => toggleSelection(selectableOrders.map((order) => order.id))}
          >
            {t("bulk_select_visible")}
          </Button>
          <span className="text-sm" aria-live="polite">
            {t("bulk_selected", { count: selectedOrders.length })}
          </span>
          <Button
            size="sm"
            disabled={selectedOrders.length === 0 || !!bulkRequest || updateStatusMutation.isPending}
            onClick={() => setBulkRequest({ orders: selectedOrders })}
          >
            {t("bulk_move")}
          </Button>
          {selectedOrders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!!bulkRequest}
              onClick={() => setSelection({ scope: selectionScope, ids: [] })}
            >
              {t("bulk_clear")}
            </Button>
          )}
        </div>
      )}

      {/* Kanban Board (los encabezados con conteo viven en la columna, sin fila de títulos duplicada) */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <OrdersKanban
          ordersByStatus={ordersByStatus}
          onDragEnd={handleDragEnd}
          onViewDetail={handleViewDetail}
          onCancelOrder={(order) => setCancellingOrder(order)}
          showBranch={showAllBranches}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          disabled={!!bulkRequest || updateStatusMutation.isPending}
          showCancelled={showCancelled}
        />
      )}

      {bulkRequest && (
        <BulkOrderStatusDialog
          orders={bulkRequest.orders}
          initialStatus={bulkRequest.status}
          onClose={() => setBulkRequest(null)}
          onResults={(result) => {
            const successes = new Set(result.results.filter((r) => r.succeeded).map((r) => r.orderId))
            setSelection((previous) => ({ ...previous, ids: previous.ids.filter((id) => !successes.has(id)) }))
            if (result.failureCount === 0) notify.success(t("bulk_success", { count: result.successCount }))
            else notify.error(t("bulk_result", { success: result.successCount, failed: result.failureCount }))
          }}
        />
      )}

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selectedOrder}
        onEdit={() => setEditOrderOpen(true)}
      />
      <CancelOrderDialog
        open={cancellingOrder !== null}
        onOpenChange={(open) => {
          if (!open) setCancellingOrder(null)
        }}
        order={cancellingOrder}
        onSuccess={() => {
          setCancellingOrder(null)
          setShowCancelled(true)
        }}
      />
      <EditOrderDialog open={editOrderOpen} onOpenChange={setEditOrderOpen} orderId={selectedOrder?.id ?? null} />

      {/* Advertencia de inventario insuficiente antes de confirmar la orden */}
      <AlertDialog
        open={stockWarning !== null}
        onOpenChange={(open) => {
          if (!open) {
            pendingConfirmRef.current = null
            setStockWarning(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("stock_warning_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("stock_warning_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {(stockWarning ?? []).map((item, index) => (
              <li
                key={item.itemId ?? index}
                className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <span className="min-w-0 truncate font-medium">{item.name}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {t("stock_warning_line", { requested: item.requested, available: item.available })}
                </span>
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("stock_warning_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDespiteShortage}>{t("stock_warning_confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Domiciliario al pasar un pedido a domicilio a "En camino" */}
      <CourierPickerDialog
        open={dispatchOrder !== null}
        onOpenChange={(open) => !open && setDispatchOrder(null)}
        branchId={dispatchOrder?.branchId ?? null}
        title={t("delivery_dispatch_title")}
        description={t("delivery_dispatch_desc")}
        confirmLabel={t("delivery_dispatch")}
        defaultCourierId={dispatchOrder?.courierId ?? null}
        isPending={updateStatusMutation.isPending}
        onConfirm={(courierId) => dispatchOrder && applyStatus(dispatchOrder.id, "Shipped", courierId)}
      />

      {/* Creación manual de órdenes (venta de caja / domicilio) */}
      <ManualOrderDialog open={createOrderOpen} onOpenChange={setCreateOrderOpen} branchId={branchId || null} />
    </div>
  )
}

type IntegrationState = "active" | "configured" | "none"

/**
 * Círculo indicativo del estado de la integración en la sucursal seleccionada:
 * verde = activa · ámbar/naranja = configurada (inactiva) · rojo = no configurada.
 * Colores ya usados en la app (emerald/amber/red de las wizards de integración).
 */
function StatusDot({ state }: { state: IntegrationState }) {
  return (
    <span
      aria-hidden
      className={`ml-1.5 inline-block size-2.5 shrink-0 rounded-full ${
        state === "active" ? "bg-emerald-500" : state === "configured" ? "bg-amber-500" : "bg-red-500"
      }`}
    />
  )
}

function integrationTitle(state: IntegrationState, t: ReturnType<typeof useTranslation>["t"]): string {
  return state === "active" ? t("active") : state === "configured" ? t("int_configured") : t("int_none")
}
