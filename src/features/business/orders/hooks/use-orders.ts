import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  createManualOrder,
  updateOrderDetails,
  retryOrderSync,
  cancelOrder,
} from "../services/orders.service"
import type { CreateManualOrderDto, UpdateOrderDetailsDto, CancelOrderDto } from "../types/api"

export const ordersKeys = {
  all: ["orders"] as const,
  list: (page: number, pageSize: number, filters?: Record<string, string>) =>
    ["orders", "list", page, pageSize, filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
}

export function useOrders(
  page: number,
  pageSize: number,
  filters?: { branchId?: string; status?: string; platform?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ordersKeys.list(page, pageSize, filters as Record<string, string>),
    queryFn: () => getOrders(page, pageSize, filters),
    enabled,
  })
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => getOrderById(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, courierId }: { id: string; status: string; courierId?: string | null }) =>
      updateOrderStatus(id, status, courierId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  })
}

export function useRetryOrderSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: retryOrderSync,
    onSettled: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  })
}
/**
 * Crea una orden manual (venta de caja / domicilio). Refresca la lista de
 * órdenes; el toast de éxito/error lo dispara el formulario.
 */
export function useCreateManualOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateManualOrderDto) => createManualOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}

/**
 * Actualiza detalles de una orden (notas, dirección, costo de envío).
 * Refresca lista y detalle; el toast lo dispara el formulario.
 */
export function useUpdateOrderDetails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderDetailsDto }) => updateOrderDetails(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}

/**
 * Cancela una orden especificando la disposición de inventario (Restocked/Waste)
 * y motivo opcional. Invalida todas las queries de órdenes.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelOrderDto }) => cancelOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}
