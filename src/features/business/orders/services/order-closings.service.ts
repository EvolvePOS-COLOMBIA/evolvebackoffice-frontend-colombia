import { api } from "@/config/axios-client"
import type {
  BranchSchedule,
  OrderClosing,
  OrderClosingDetail,
  OrderClosingPreview,
  ReconcileOrderResponse,
  ReconcilePaymentLine,
} from "../types/closing"

export async function getBranchSchedule(branchId: string): Promise<BranchSchedule> {
  const { data } = await api.get<BranchSchedule>(`/api/branches/${branchId}/schedule`)
  return data
}

/** Preview del periodo actual + pendientes arrastradas de periodos anteriores (Manager/Admin). */
export async function previewOrderClosing(branchId: string): Promise<OrderClosingPreview> {
  const { data } = await api.get<OrderClosingPreview>(`/api/branches/${branchId}/order-closing/preview`)
  return data
}

/** Genera el cierre de la ventana (las órdenes quedan asignadas). */
export async function closeOrders(branchId: string, notes?: string): Promise<OrderClosing> {
  const { data } = await api.post<OrderClosing>(`/api/branches/${branchId}/order-closings`, notes ? { notes } : {})
  return data
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

/**
 * Conciliación progresiva de una orden con varios medios de pago (la suma
 * debe dar el total). En efectivo puede enviarse el efectivo recibido: el
 * backend calcula el cambio. Lista vacía = desconciliar.
 */
export async function reconcileOrderPayments(
  orderId: string,
  payments: ReconcilePaymentLine[]
): Promise<ReconcileOrderResponse> {
  const { data } = await api.put<ReconcileOrderResponse>(`/api/orders/${orderId}/reconcile`, { payments })
  return data
}

/** Resolución desde el cierre: la orden olvidada se marca como Entregada (genera la venta). */
export async function resolveOrderDelivered(orderId: string): Promise<void> {
  await api.post(`/api/orders/${orderId}/resolve-delivered`)
}

/** Resolución desde el cierre: la orden olvidada se cancela con motivo. */
export async function cancelOrderFromClosing(orderId: string, reason?: string): Promise<void> {
  await api.post(`/api/orders/${orderId}/cancel`, null, { params: reason ? { reason } : undefined })
}
