import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createSale, getMargins, getSale, getSales, getSalesStats, voidSale } from "../services/sales.service"

/** Las ventas cambian márgenes, saldos y lo que se pide a la proveedora. */
const SALES_KEYS = [
  "inventory-margins",
  "sales",
  "sales-stats",
  "sale",
  "inventory-stock",
  "inventory-movements",
  "inventory-inbox",
]

function useInvalidateSales() {
  const queryClient = useQueryClient()
  return () => SALES_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}

export function useMargins(params: { branchId: string | null; search: string; pageNumber: number }) {
  return useQuery({
    queryKey: ["inventory-margins", params],
    queryFn: () => getMargins({ ...params, branchId: params.branchId! }),
    enabled: Boolean(params.branchId),
    placeholderData: keepPreviousData,
  })
}

export function useSales(branchId: string | null, pageNumber: number) {
  return useQuery({
    queryKey: ["sales", branchId, pageNumber],
    queryFn: () => getSales(branchId!, pageNumber),
    enabled: Boolean(branchId),
    placeholderData: keepPreviousData,
  })
}

export function useSale(id: string | null) {
  return useQuery({ queryKey: ["sale", id], queryFn: () => getSale(id!), enabled: Boolean(id) })
}

export function useCreateSale() {
  const invalidate = useInvalidateSales()
  return useMutation({ mutationFn: createSale, onSuccess: invalidate })
}

export function useVoidSale() {
  const invalidate = useInvalidateSales()
  return useMutation({ mutationFn: voidSale, onSuccess: invalidate })
}

export function useSalesStats(branchId: string | null) {
  return useQuery({
    queryKey: ["sales-stats", branchId],
    queryFn: () => getSalesStats(branchId!),
    enabled: Boolean(branchId),
  })
}
