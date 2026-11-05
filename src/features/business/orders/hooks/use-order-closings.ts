import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  cancelOrderFromClosing,
  closeOrders,
  getOrderClosing,
  listOrderClosings,
  previewOrderClosing,
  reconcileOrderPayments,
  resolveOrderDelivered,
} from "../services/order-closings.service"
import type { ReconcilePaymentLine } from "../types/closing"

export function useOrderClosingPreview(branchId: string | null) {
  return useQuery({
    queryKey: ["order-closing-preview", branchId],
    queryFn: () => previewOrderClosing(branchId!),
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
    queryClient.invalidateQueries({ queryKey: ["order-closings"] })
    queryClient.invalidateQueries({ queryKey: ["order-closing-detail"] })
    queryClient.invalidateQueries({ queryKey: ["orders"] })
  }
}

export function useCloseOrders() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({ branchId, notes }: { branchId: string; notes?: string }) => closeOrders(branchId, notes),
    onSuccess: invalidate,
  })
}

/** Concilia una orden con varios medios de pago (efectivo con cambio incluido). */
export function useReconcileOrderPayments() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({ orderId, payments }: { orderId: string; payments: ReconcilePaymentLine[] }) =>
      reconcileOrderPayments(orderId, payments),
    onSuccess: invalidate,
  })
}

/**
 * Resuelve una orden sin estado final desde el cierre: entregada (primero se
 * concilian sus pagos para que la venta use el medio real) o cancelada.
 */
export function useResolveClosingOrder() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: async (
      input:
        | { orderId: string; outcome: "delivered"; payments: ReconcilePaymentLine[] }
        | { orderId: string; outcome: "cancelled"; reason?: string }
    ) => {
      if (input.outcome === "cancelled") return cancelOrderFromClosing(input.orderId, input.reason)
      await reconcileOrderPayments(input.orderId, input.payments)
      await resolveOrderDelivered(input.orderId)
    },
    // También en error: si la conciliación quedó aplicada, la vista debe reflejarlo.
    onSettled: invalidate,
  })
}
