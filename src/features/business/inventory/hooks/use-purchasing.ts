import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  cancelPurchaseOrder,
  closePurchaseOrder,
  createGoodsReceipt,
  createPurchaseOrder,
  createTransfer,
  dispatchPurchaseOrder,
  getGoodsReceipts,
  getPurchaseOrder,
  getPurchaseOrders,
  getTransfer,
  getTransfers,
  receivePurchaseOrder,
  receiveTransfer,
  resolveTransferDifference,
  sendPurchaseOrder,
  voidGoodsReceipt,
} from "../services/purchasing.service"

/** Cualquier cambio de pedidos/envíos/entradas mueve saldos y la bandeja. */
const PURCHASING_KEYS = [
  "purchase-orders",
  "purchase-order",
  "transfers",
  "transfer",
  "goods-receipts",
  "inventory-stock",
  "inventory-movements",
  "inventory-inbox",
]

function useInvalidatePurchasing() {
  const queryClient = useQueryClient()
  return () => PURCHASING_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}

export function usePurchaseOrders(params: {
  branchId: string | null
  direction: "outgoing" | "incoming"
  kind?: "internal" | "external"
  status?: string
  pageNumber: number
}) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => getPurchaseOrders({ ...params, branchId: params.branchId! }),
    enabled: Boolean(params.branchId),
    placeholderData: keepPreviousData,
  })
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({ queryKey: ["purchase-order", id], queryFn: () => getPurchaseOrder(id!), enabled: Boolean(id) })
}

export function useTransfers(params: {
  branchId: string | null
  direction: "outgoing" | "incoming"
  status?: string
  pageNumber: number
}) {
  return useQuery({
    queryKey: ["transfers", params],
    queryFn: () => getTransfers({ ...params, branchId: params.branchId! }),
    enabled: Boolean(params.branchId),
    placeholderData: keepPreviousData,
  })
}

export function useTransfer(id: string | null) {
  return useQuery({ queryKey: ["transfer", id], queryFn: () => getTransfer(id!), enabled: Boolean(id) })
}

export function useGoodsReceipts(branchId: string | null, pageNumber: number) {
  return useQuery({
    queryKey: ["goods-receipts", branchId, pageNumber],
    queryFn: () => getGoodsReceipts(branchId!, pageNumber),
    enabled: Boolean(branchId),
    placeholderData: keepPreviousData,
  })
}

function usePurchasingMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const invalidate = useInvalidatePurchasing()
  return useMutation({ mutationFn: fn, onSuccess: invalidate })
}

export const useCreatePurchaseOrder = () => usePurchasingMutation(createPurchaseOrder)
export const useSendPurchaseOrder = () => usePurchasingMutation(sendPurchaseOrder)
export const useClosePurchaseOrder = () => usePurchasingMutation(closePurchaseOrder)
export const useCancelPurchaseOrder = () => usePurchasingMutation(cancelPurchaseOrder)
export const useDispatchPurchaseOrder = () =>
  usePurchasingMutation(
    (args: {
      id: string
      lines: { lineId: string; quantity: number; unitPrice: number | null }[] | null
      notes: string | null
    }) => dispatchPurchaseOrder(args.id, args.lines, args.notes)
  )
export const useReceivePurchaseOrder = () =>
  usePurchasingMutation((args: { id: string } & Parameters<typeof receivePurchaseOrder>[1]) =>
    receivePurchaseOrder(args.id, args)
  )
export const useCreateTransfer = () => usePurchasingMutation(createTransfer)
export const useReceiveTransfer = () =>
  usePurchasingMutation((args: { id: string } & Parameters<typeof receiveTransfer>[1]) =>
    receiveTransfer(args.id, args)
  )
export const useResolveDifference = () =>
  usePurchasingMutation((args: { id: string; lineId: string; resolution: "lost" | "returned" }) =>
    resolveTransferDifference(args.id, args.lineId, args.resolution)
  )
export const useCreateGoodsReceipt = () => usePurchasingMutation(createGoodsReceipt)
export const useVoidGoodsReceipt = () => usePurchasingMutation(voidGoodsReceipt)
