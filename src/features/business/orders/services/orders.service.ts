import { api } from "@/config/axios-client"
import type {
  PagedOrders,
  OrderDetail,
  OrderStockCheck,
  NewOrdersUpdate,
  CreateManualOrderDto,
  UpdateOrderDetailsDto,
  CancelOrderDto,
  BulkUpdateOrderStatusDto,
  BulkOrderStatusItemResult,
  BulkOrderStatusResultDto,
  RouteNotification,
} from "../types/api"

function normalizePagedResponse(raw: unknown, pageSize: number): PagedOrders {
  if (raw && typeof raw === "object" && "data" in raw) {
    const obj = raw as Record<string, unknown>
    const data = Array.isArray(obj.data) ? obj.data : []
    const totalCount = typeof obj.totalCount === "number" ? obj.totalCount : data.length
    return { data, totalCount, totalPages: Math.ceil(totalCount / pageSize) }
  }
  if (Array.isArray(raw)) {
    return { data: raw, totalCount: raw.length, totalPages: 1 }
  }
  return { data: [], totalCount: 0, totalPages: 0 }
}

export async function getOrders(
  pageNumber: number,
  pageSize: number,
  filters?: { branchId?: string; status?: string; platform?: string }
): Promise<PagedOrders> {
  const params: Record<string, unknown> = { pageNumber, pageSize }
  if (filters?.branchId) params.branchId = filters.branchId
  if (filters?.status) params.status = filters.status
  if (filters?.platform) params.platform = filters.platform
  const { data } = await api.get("/api/orders", { params })
  return normalizePagedResponse(data, pageSize)
}

/**
 * Ventana de órdenes: todas las órdenes del periodo actual (día operativo de la
 * sucursal, o de cada sucursal si no se indica). Sin paginación: el backend
 * devuelve el turno completo y no incluye órdenes de días anteriores.
 */
export async function getCurrentPeriodOrders(branchId?: string): Promise<PagedOrders> {
  const { data } = await api.get("/api/orders/current-period", {
    params: branchId ? { branchId } : undefined,
  })
  const page = normalizePagedResponse(data, 1)
  return { ...page, totalPages: page.data.length > 0 ? 1 : 0 }
}

export async function getOrderById(id: string): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/api/orders/${id}`)
  return data
}

/** Cambia el estado; al asignar domiciliario devuelve el resultado del envío de la ruta por WhatsApp. */
export async function updateOrderStatus(
  id: string,
  status: string,
  deliveryUserId?: string | null
): Promise<UpdateOrderStatusResult> {
  const { data } = await api.put<
    { routeNotification?: RouteNotification | null; courierNotification?: RouteNotification | null } | undefined
  >(`/api/orders/${id}/status`, { status, deliveryUserId: deliveryUserId ?? null })
  return {
    routeNotification: data?.routeNotification ?? null,
    courierNotification: data?.courierNotification ?? null,
  }
}

/**
 * Resultado del cambio de estado: la ruta enviada al asignar domiciliario y el
 * aviso con el cuadre del turno al pasar a Entregado.
 */
export interface UpdateOrderStatusResult {
  routeNotification: RouteNotification | null
  courierNotification: RouteNotification | null
}

/** Reenvía al domiciliario asignado la ruta del pedido por WhatsApp. */
export async function notifyOrderRoute(id: string): Promise<RouteNotification> {
  const { data } = await api.post<RouteNotification>(`/api/orders/${id}/notify-route`)
  return data
}

/**
 * Cambio de estado múltiple (varios pedidos a "En camino" con el mismo
 * domiciliario). El backend acepta hasta 50 ids por llamada; aquí se fragmenta
 * automáticamente y se agregan los resultados por pedido.
 */
export async function bulkUpdateOrderStatus(payload: BulkUpdateOrderStatusDto): Promise<BulkOrderStatusResultDto> {
  const chunks: string[][] = []
  for (let i = 0; i < payload.ids.length; i += 50) {
    chunks.push(payload.ids.slice(i, i + 50))
  }
  const results: BulkOrderStatusItemResult[] = []
  const routeNotifications: RouteNotification[] = []
  for (const ids of chunks) {
    const { data } = await api.put<BulkOrderStatusResultDto & { routeNotification?: RouteNotification | null }>(
      "/api/orders/status/bulk",
      {
        ...payload,
        ids,
      }
    )
    results.push(...(data?.results ?? []))
    if (data?.routeNotification) routeNotifications.push(data.routeNotification)
  }
  return { results, routeNotifications }
}

/** Inventario de la orden contra la sucursal. Solo informativo, nunca bloquea. */
export async function checkOrderStock(id: string): Promise<OrderStockCheck> {
  const { data } = await api.get<OrderStockCheck>(`/api/orders/${id}/stock-check`)
  return data
}

export async function addOrderProduct(
  orderId: string,
  product: { posId: string; sku?: string; comments?: string; quantity: number; modifiers?: unknown[] }
): Promise<{ cluviOrderProductId: string; totalOrder: number }> {
  const { data } = await api.post(`/api/orders/${orderId}/products`, product)
  return data
}

export async function removeOrderProduct(orderId: string, productId: string): Promise<{ totalOrder: number }> {
  const { data } = await api.delete(`/api/orders/${orderId}/products/${productId}`)
  return data
}

/**
 * Long-poll de órdenes nuevas (`GET /api/orders/updates`). Si no hay órdenes
 * desde `sinceUtc`, el backend mantiene la conexión hasta `waitSeconds` (máx.
 * 30) esperando una inserción — el cliente solo debe repetir con el `nowUtc`
 * devuelto como nuevo `sinceUtc`. `signal` permite abortar al desmontar.
 */
export async function fetchNewOrders(sinceUtc: string, signal?: AbortSignal): Promise<NewOrdersUpdate> {
  const { data } = await api.get<NewOrdersUpdate>("/api/orders/updates", {
    params: { sinceUtc, waitSeconds: 25 },
    signal,
  })
  return data
}

/**
 * Crea una orden manual (venta de caja o domicilio). En tenants colombianos
 * el backend garantiza que el total sea el precio rotulado (IVA incluido):
 * no se envía `tax` ni se agrega nada al total.
 */
export async function createManualOrder(payload: CreateManualOrderDto): Promise<OrderDetail> {
  const { data } = await api.post<OrderDetail>("/api/orders", payload)
  return data
}

/**
 * Actualiza detalles editables de una orden (notas, dirección de envío, costo
 * de domicilio). El backend hace push best-effort a la plataforma externa:
 * WooCommerce recibe la dirección/notas; Cluvi no expone endpoint (solo
 * productos y estados según docs/cluvi-api-reference.md).
 */
export async function updateOrderDetails(id: string, payload: UpdateOrderDetailsDto): Promise<void> {
  await api.put(`/api/orders/${id}/details`, payload)
}

/**
 * Cancela una orden. Permite indicar si los productos regresan al stock
 * disponible (Restocked) o se registran como merma física (Waste), y el motivo.
 */
export async function cancelOrder(id: string, payload?: CancelOrderDto): Promise<RouteNotification | null> {
  // Si el pedido iba en camino, el backend avisa al domiciliario por WhatsApp.
  const { data } = await api.post<{ courierNotification?: RouteNotification | null } | "">(
    `/api/orders/${id}/cancel`,
    payload ?? {}
  )
  return (data && data.courierNotification) || null
}
