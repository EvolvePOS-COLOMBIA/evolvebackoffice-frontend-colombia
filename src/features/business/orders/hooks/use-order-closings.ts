import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  closeOrders,
  getOrderClosing,
  listOrderClosings,
  listPendingClosingDates,
  previewOrderClosing,
  reconcileOrder,
  resolveOrderAsDelivered,
} from "../services/order-closings.service"
import { cancelOrder } from "../services/orders.service"

/** Preview del periodo de `date` (null = turno actual). */
export function useOrderClosingPreview(branchId: string | null, date: string | null = null) {
  return useQuery({
    queryKey: ["order-closing-preview", branchId, date ?? "current"],
    queryFn: () => previewOrderClosing(branchId!, date),
    enabled: !!branchId,
  })
}

/** Días anteriores con órdenes sin cierre de la sucursal. */
export function usePendingClosingDates(branchId: string | null) {
  return useQuery({
    queryKey: ["order-closing-pending-dates", branchId],
    queryFn: () => listPendingClosingDates(branchId!),
    enabled: !!branchId,
  })
}

export function useOrderClosings(branchId: string | null) {
  return useQuery({
    queryKey: ["order-closings", branchId],
    queryFn: () => listOrderClosings(branchId ?? undefined),
    enabled: true,
  })
}

export function useOrderClosingDetail(closingId: string | null) {
  return useQuery({
    queryKey: ["order-closing-detail", closingId],
    queryFn: () => getOrderClosing(closingId!),
    enabled: !!closingId,
  })
}

function useClosingInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["order-closing-preview"] })
    queryClient.invalidateQueries({ queryKey: ["order-closing-pending-dates"] })
    queryClient.invalidateQueries({ queryKey: ["order-closings"] })
    queryClient.invalidateQueries({ queryKey: ["order-closing-detail"] })
    queryClient.invalidateQueries({ queryKey: ["orders"] })
  }
}

export function useCloseOrders() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({ branchId, notes, date }: { branchId: string; notes?: string; date?: string | null }) =>
      closeOrders(branchId, notes, date),
    onSuccess: invalidate,
  })
}

/**
 * Decisión sobre una orden sin estado final desde el cierre de su día:
 * entregada (genera la venta) o cancelada (con motivo).
 */
export function useResolvePendingOrder() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({
      orderId,
      outcome,
      reason,
    }: {
      orderId: string
      outcome: "delivered" | "cancelled"
      reason?: string
    }) =>
      outcome === "delivered"
        ? resolveOrderAsDelivered(orderId)
        : // El cierre no muestra el resultado del aviso al domiciliario.
          cancelOrder(orderId, { reason }).then(() => undefined),
    onSuccess: invalidate,
  })
}

export function useReconcileOrder(closingId: string | null) {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({
      orderId,
      reconciled,
      paymentMethodCode,
    }: {
      orderId: string
      reconciled: boolean
      paymentMethodCode?: string
    }) => reconcileOrder(closingId!, orderId, reconciled, paymentMethodCode),
    onSuccess: invalidate,
  })
}
