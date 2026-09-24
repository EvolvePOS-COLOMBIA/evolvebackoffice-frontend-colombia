import { api } from "@/config/axios-client"
import type {
  PagedOrders,
  OrderDetail,
  BranchIntegration,
  CreateIntegrationDto,
  SyncMenuResponse,
  TestConnectionResult,
  ActivateStoreResult,
} from "../types/api"

function normalizePagedResponse(raw: unknown, pageNumber: number, pageSize: number): PagedOrders {
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
  return normalizePagedResponse(data, pageNumber, pageSize)
}

export async function getOrderById(id: string): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/api/orders/${id}`)
  return data
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await api.put(`/api/orders/${id}/status`, { status })
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
