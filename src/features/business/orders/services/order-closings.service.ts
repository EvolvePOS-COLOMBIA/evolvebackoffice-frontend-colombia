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

/** Preview: ventana actual + órdenes pendientes de cerrar (rol Manager/Admin). */
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
