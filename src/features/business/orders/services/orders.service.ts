import { api } from "@/config/axios-client"
import type { BulkOrderStatusRequest, BulkOrderStatusResult } from "../types/bulk-status"
import type {
  PagedOrders,
  OrderDetail,
  OrderStockCheck,
  NewOrdersUpdate,
  CreateManualOrderDto,
  UpdateOrderDetailsDto,
  CancelOrderDto,
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

export async function getOrderById(id: string): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/api/orders/${id}`)
  return data
}

export async function retryOrderSync(
  id: string
): Promise<{ success: boolean; pending: boolean; message: string | null }> {
  const { data } = await api.post<{ success: boolean; pending: boolean; message: string | null }>(
    `/api/orders/${id}/retry-sync`
  )
  return data
}

/**
 * Cambia el estado. `courierId` asigna el domiciliario en el mismo paso: el
 * backend lo exige para pasar un pedido a domicilio a En camino.
 */
export async function updateOrderStatus(id: string, status: string, courierId?: string | null): Promise<void> {
  await api.put(`/api/orders/${id}/status`, courierId ? { status, courierId } : { status })
}

export async function bulkUpdateOrderStatus(request: BulkOrderStatusRequest): Promise<BulkOrderStatusResult> {
  // Cada pedido puede hacer un push externo de hasta 8s; no cortar un lote válido.
  const { data } = await api.put<BulkOrderStatusResult>("/api/orders/status/bulk", request, { timeout: 600000 })
  return data
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
export async function cancelOrder(id: string, payload?: CancelOrderDto): Promise<void> {
  await api.post(`/api/orders/${id}/cancel`, payload ?? {})
}
