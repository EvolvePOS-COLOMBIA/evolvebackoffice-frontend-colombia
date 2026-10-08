import { api } from "@/config/axios-client"
import type { Courier, CourierPayload, DeliveryBoard, PagedCouriers } from "../types/delivery"

export async function getCouriers(params: {
  pageNumber?: number
  pageSize?: number
  branchId?: string | null
  includeInactive?: boolean
  searchValue?: string
}): Promise<PagedCouriers> {
  const pageSize = params.pageSize ?? 100
  const { data } = await api.get<{ data: Courier[]; totalCount: number }>("/api/couriers", {
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize,
      branchId: params.branchId || undefined,
      includeInactive: params.includeInactive || undefined,
      searchValue: params.searchValue || undefined,
    },
  })
  const list = Array.isArray(data?.data) ? data.data : []
  const totalCount = typeof data?.totalCount === "number" ? data.totalCount : list.length
  return { data: list, totalCount, totalPages: Math.ceil(totalCount / pageSize) }
}

export async function createCourier(payload: CourierPayload): Promise<Courier> {
  const { data } = await api.post<Courier>("/api/couriers", payload)
  return data
}

export async function updateCourier(id: string, payload: CourierPayload): Promise<Courier> {
  const { data } = await api.put<Courier>(`/api/couriers/${id}`, payload)
  return data
}

export async function setCourierActive(id: string, active: boolean): Promise<void> {
  await api.post(`/api/couriers/${id}/${active ? "activate" : "deactivate"}`)
}

/** Asigna (courierId) o quita (null) el domiciliario de un pedido Listo o En camino. */
export async function assignOrderCourier(orderId: string, courierId: string | null): Promise<void> {
  await api.put(`/api/orders/${orderId}/courier`, { courierId })
}

/**
 * Vista de domicilios del día local (zona de la sucursal → sede → UTC):
 * Listos / En camino / Entregados agrupados por domiciliario.
 */
export async function getDeliveryBoard(params: {
  branchId?: string | null
  courierId?: string | null
  date?: string | null
}): Promise<DeliveryBoard> {
  const { data } = await api.get<DeliveryBoard>("/api/orders/deliveries", {
    params: {
      branchId: params.branchId || undefined,
      courierId: params.courierId || undefined,
      date: params.date || undefined,
    },
  })
  return data
}
