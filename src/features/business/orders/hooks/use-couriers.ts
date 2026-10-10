import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { assignOrderCourier, getCouriers, getDeliveryBoard } from "../services/couriers.service"
import { ordersKeys } from "./use-orders"

export const couriersKeys = {
  all: ["couriers"] as const,
  list: (branchId: string | null, includeInactive: boolean, search: string) =>
    ["couriers", "list", branchId, includeInactive, search] as const,
  board: (branchId: string | null, date: string | null) => ["orders", "deliveries", branchId, date] as const,
}

/** Domiciliarios (activos por defecto) de una sucursal + los que atienden todas. */
export function useCouriers(branchId: string | null, includeInactive = false, search = "") {
  return useQuery({
    queryKey: couriersKeys.list(branchId, includeInactive, search),
    queryFn: () => getCouriers({ branchId, includeInactive, searchValue: search }),
    staleTime: 30_000,
  })
}

/** Asigna o quita el domiciliario; refresca órdenes y la vista de domicilios. */
export function useAssignCourier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, courierId }: { orderId: string; courierId: string | null }) =>
      assignOrderCourier(orderId, courierId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  })
}

/** Vista de domicilios; se refresca sola cada 30 s (pedidos entrando por Cluvi). */
export function useDeliveryBoard(branchId: string | null, date: string | null, enabled = true) {
  return useQuery({
    queryKey: couriersKeys.board(branchId, date),
    queryFn: () => getDeliveryBoard({ branchId, date }),
    enabled,
    refetchInterval: 60_000,
  })
}
