import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ordersKeys } from "@/features/business/orders/hooks/use-orders"
import {
  activateDomiciliario,
  addExtraBase,
  addPartialPickup,
  closeShift,
  deliverOrder,
  getBranchDeliverySettings,
  getDomiciliarios,
  getShiftDetail,
  getShifts,
  updateBranchDeliverySettings,
} from "../services/delivery.service"
import type {
  ActivateDomiciliarioDto,
  DeliveryDomiciliarioDto,
  DeliveryMovementRequestDto,
  DeliveryShiftDetailDto,
  DeliveryShiftDto,
  DeliveryShiftMovementDto,
  DeliverOrderDto,
  DeliverOrderResponseDto,
  UpdateBranchDeliverySettingsDto,
} from "../types"

export const deliveryKeys = {
  all: ["delivery"] as const,
  domiciliarios: (branchId?: string, status?: "active" | "inactive") =>
    [...deliveryKeys.all, "domiciliarios", branchId ?? "all", status ?? "all"] as const,
  shifts: (branchId?: string, status?: "open" | "closed") =>
    [...deliveryKeys.all, "shifts", branchId ?? "all", status ?? "all"] as const,
  shiftDetail: (shiftId: string) => [...deliveryKeys.all, "shift", shiftId] as const,
  settings: (branchId: string) => [...deliveryKeys.all, "settings", branchId] as const,
}

/** Domiciliarios de la sucursal (o de todas las sucursales sin branchId). */
export function useDomiciliarios(branchId?: string, status?: "active" | "inactive") {
  return useQuery<DeliveryDomiciliarioDto[]>({
    queryKey: deliveryKeys.domiciliarios(branchId, status),
    queryFn: () => getDomiciliarios(branchId, status),
    enabled: Boolean(branchId),
  })
}

/**
 * Domiciliarios con turno abierto (para asignar pedidos). Se consulta sin
 * `branchId` para poder filtrar en cliente por la sucursal de cada pedido.
 */
export function useActiveDomiciliarios(enabled = true) {
  return useQuery<DeliveryDomiciliarioDto[]>({
    queryKey: deliveryKeys.domiciliarios(undefined, "active"),
    queryFn: () => getDomiciliarios(undefined, "active"),
    enabled,
    staleTime: 30_000,
  })
}

export function useShifts(branchId?: string, status?: "open" | "closed") {
  return useQuery<DeliveryShiftDto[]>({
    queryKey: deliveryKeys.shifts(branchId, status),
    queryFn: () => getShifts(branchId, status),
    enabled: Boolean(branchId),
  })
}

export function useShiftDetail(shiftId: string | null) {
  return useQuery<DeliveryShiftDetailDto>({
    queryKey: deliveryKeys.shiftDetail(shiftId ?? ""),
    queryFn: () => getShiftDetail(shiftId!),
    enabled: Boolean(shiftId),
  })
}

/** Invalida domiciliarios, turnos y detalle tras cualquier movimiento del módulo. */
function useInvalidateDelivery() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: deliveryKeys.all })
}

export function useActivateDomiciliario() {
  const invalidate = useInvalidateDelivery()
  return useMutation<DeliveryShiftDto, Error, { userId: string; payload: ActivateDomiciliarioDto }>({
    mutationFn: ({ userId, payload }) => activateDomiciliario(userId, payload),
    onSuccess: invalidate,
  })
}

/** Más base / recogida parcial; `kind` define el endpoint. */
export function useAddShiftMovement(kind: "extra-base" | "pickup") {
  const invalidate = useInvalidateDelivery()
  return useMutation<DeliveryShiftMovementDto, Error, { shiftId: string; payload: DeliveryMovementRequestDto }>({
    mutationFn: ({ shiftId, payload }) =>
      kind === "extra-base" ? addExtraBase(shiftId, payload) : addPartialPickup(shiftId, payload),
    onSuccess: invalidate,
  })
}

export function useCloseShift() {
  const invalidate = useInvalidateDelivery()
  return useMutation<DeliveryShiftDto, Error, string>({
    mutationFn: closeShift,
    onSuccess: invalidate,
  })
}

export function useDeliverOrder() {
  const invalidate = useInvalidateDelivery()
  const queryClient = useQueryClient()
  return useMutation<DeliverOrderResponseDto, Error, { orderId: string; payload: DeliverOrderDto }>({
    mutationFn: ({ orderId, payload }) => deliverOrder(orderId, payload),
    onSuccess: () => {
      invalidate()
      // La entrega cambia el estado del pedido y genera su venta.
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}

export function useBranchDeliverySettings(branchId: string | null) {
  return useQuery({
    queryKey: deliveryKeys.settings(branchId ?? ""),
    queryFn: () => getBranchDeliverySettings(branchId!),
    enabled: Boolean(branchId),
  })
}

export function useUpdateBranchDeliverySettings() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof updateBranchDeliverySettings>>,
    Error,
    { branchId: string; payload: UpdateBranchDeliverySettingsDto }
  >({
    mutationFn: ({ branchId, payload }) => updateBranchDeliverySettings(branchId, payload),
    onSuccess: (_data, { branchId }) => queryClient.invalidateQueries({ queryKey: deliveryKeys.settings(branchId) }),
  })
}
