import { api } from "@/config/axios-client"
import type {
  PagedOrders,
  OrderDetail,
  OrderStockCheck,
  BranchIntegration,
  CreateIntegrationDto,
  UpdateIntegrationDto,
  SyncMenuResponse,
  TestConnectionResult,
  ActivateStoreResult,
  NewOrdersUpdate,
  CreateManualOrderDto,
  UpdateOrderDetailsDto,
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

/**
 * Cambia el estado. `courierId` asigna el domiciliario en el mismo paso: el
 * backend lo exige para pasar un pedido a domicilio a En camino.
 */
export async function updateOrderStatus(id: string, status: string, courierId?: string | null): Promise<void> {
  await api.put(`/api/orders/${id}/status`, courierId ? { status, courierId } : { status })
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

export async function getBranchIntegrations(branchId: string): Promise<BranchIntegration[]> {
  const { data } = await api.get(`/api/branches/${branchId}/integrations`)
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function createIntegration(branchId: string, dto: CreateIntegrationDto): Promise<BranchIntegration> {
  const { data } = await api.post(`/api/branches/${branchId}/integrations`, dto)
  return data
}

export async function updateIntegration(
  branchId: string,
  integrationId: string,
  dto: UpdateIntegrationDto
): Promise<BranchIntegration> {
  const { data } = await api.put(`/api/branches/${branchId}/integrations/${integrationId}`, dto)
  return data
}

/** Prueba la conexión; la respuesta incluye storeStatus ("on"/"off"). */
export async function testConnection(branchId: string, integrationId: string): Promise<TestConnectionResult> {
  const { data } = await api.post<TestConnectionResult>(
    `/api/branches/${branchId}/integrations/${integrationId}/test-connection`
  )
  return data
}

/**
 * Activa la tienda en Cluvi para aceptar pedidos. El backend configura los
 * webhooks (new_order → webhook del backend, ping → /health) que Cluvi
 * exige al activar.
 */
export async function activateStore(branchId: string, integrationId: string): Promise<ActivateStoreResult> {
  const { data } = await api.post<ActivateStoreResult>(
    `/api/branches/${branchId}/integrations/${integrationId}/activate-store`
  )
  return data
}

/**
 * Sincroniza el menú de la sucursal hacia Cluvi. El backend construye el menú
 * desde los artículos con IsPublishedForWeb y sus modificadores — no se
 * envían productos en la petición.
 */
export async function syncMenu(branchId: string, integrationId: string): Promise<SyncMenuResponse> {
  const { data } = await api.put<SyncMenuResponse>(`/api/branches/${branchId}/integrations/${integrationId}/sync-menu`)
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
