import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  closeOrders,
  getOrderClosing,
  listOrderClosings,
  previewOrderClosing,
  reconcileOrder,
  reconcileOrderPayments,
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

/** Concilia una orden con varios medios de pago (efectivo con cambio incluido). */
export function useReconcileOrderPayments() {
  const invalidate = useClosingInvalidation()
  return useMutation({
    mutationFn: ({ orderId, payments }: { orderId: string; payments: ReconcilePaymentLine[] }) =>
      reconcileOrderPayments(orderId, payments),
    onSuccess: invalidate,
  })
}
