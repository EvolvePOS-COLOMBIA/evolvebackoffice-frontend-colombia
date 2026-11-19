import { api } from "@/config/axios-client"
import type {
  BranchSchedule,
  OrderClosing,
  OrderClosingDetail,
  OrderClosingPendingDate,
  OrderClosingPreview,
} from "../types/closing"

export async function getBranchSchedule(branchId: string): Promise<BranchSchedule> {
  const { data } = await api.get<BranchSchedule>(`/api/branches/${branchId}/schedule`)
  return data
}

/**
 * Preview del periodo (día operativo) de `date` (YYYY-MM-DD); sin fecha = turno
 * actual. Solo incluye las órdenes creadas en ese día (rol Manager/Admin).
 */
export async function previewOrderClosing(branchId: string, date?: string | null): Promise<OrderClosingPreview> {
  const { data } = await api.get<OrderClosingPreview>(`/api/branches/${branchId}/order-closing/preview`, {
    params: date ? { date } : undefined,
  })
  return data
}

/** Días anteriores al actual con órdenes sin cierre (más antiguo primero). */
export async function listPendingClosingDates(branchId: string): Promise<OrderClosingPendingDate[]> {
  const { data } = await api.get<OrderClosingPendingDate[]>(`/api/branches/${branchId}/order-closing/pending-dates`)
  return data ?? []
}

/** Genera el cierre del periodo de `date` (sin fecha = turno actual); sus órdenes finalizadas quedan asignadas. */
export async function closeOrders(branchId: string, notes?: string, date?: string | null): Promise<OrderClosing> {
  const body: { notes?: string; date?: string } = {}
  if (notes) body.notes = notes
  if (date) body.date = date
  const { data } = await api.post<OrderClosing>(`/api/branches/${branchId}/order-closings`, body)
  return data
}

/** Resuelve desde el cierre una orden sin estado final como entregada (genera su venta). */
export async function resolveOrderAsDelivered(orderId: string): Promise<void> {
  await api.post(`/api/orders/${orderId}/resolve-delivered`)
}

export async function listOrderClosings(branchId?: string): Promise<OrderClosing[]> {
  const { data } = await api.get<OrderClosing[]>("/api/order-closings", {
    params: branchId ? { branchId } : undefined,
  })
  return data ?? []
}

export async function getOrderClosing(closingId: string): Promise<OrderClosingDetail> {
  const { data } = await api.get<OrderClosingDetail>(`/api/order-closings/${closingId}`)
  return data
}

/** Marca/desmarca una orden del cierre como conciliada con su medio de cobro. */
export async function reconcileOrder(
  closingId: string,
  orderId: string,
  reconciled: boolean,
  paymentMethodCode?: string
): Promise<OrderClosingDetail> {
  const { data } = await api.put<OrderClosingDetail>(`/api/order-closings/${closingId}/reconcile`, {
    orderId,
    reconciled,
    paymentMethodCode: paymentMethodCode ?? null,
  })
  return data
}
