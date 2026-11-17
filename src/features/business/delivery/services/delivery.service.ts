import { api } from "@/config/axios-client"
import type {
  ActivateDomiciliarioDto,
  BranchDeliverySettingsDto,
  DeliveryDomiciliarioDto,
  DeliveryMovementRequestDto,
  DeliveryShiftDetailDto,
  DeliveryShiftDto,
  DeliveryShiftMovementDto,
  DeliverOrderDto,
  DeliverOrderResponseDto,
  UpdateBranchDeliverySettingsDto,
} from "../types"

/**
 * Servicio del módulo de Domicilios (endpoints B14 de `AGENTS.md`).
 * Todos los endpoints exigen Manager/Admin y el header `X-Tenant-Id`
 * (lo inyecta `axios-client`).
 */

/** Domiciliarios (rol DELIVERY) con estado de turno y base. `{data, totalCount}` sin paginar. */
export async function getDomiciliarios(
  branchId?: string,
  status?: "active" | "inactive"
): Promise<DeliveryDomiciliarioDto[]> {
  const params: Record<string, unknown> = {}
  if (branchId) params.branchId = branchId
  if (status) params.status = status
  const { data } = await api.get<{ data: DeliveryDomiciliarioDto[]; totalCount: number }>(
    "/api/delivery/domiciliarios",
    { params }
  )
  return data?.data ?? []
}

/** Activar domiciliario = abrir turno con la base confirmada. */
export async function activateDomiciliario(
  userId: string,
  payload: ActivateDomiciliarioDto
): Promise<DeliveryShiftDto> {
  const { data } = await api.post<DeliveryShiftDto>(`/api/delivery/domiciliarios/${userId}/activate`, payload)
  return data
}

/** Turnos de la sucursal (o de todas si no se indica branchId). */
export async function getShifts(branchId?: string, status?: "open" | "closed"): Promise<DeliveryShiftDto[]> {
  const params: Record<string, unknown> = {}
  if (branchId) params.branchId = branchId
  if (status) params.status = status
  const { data } = await api.get<{ data: DeliveryShiftDto[]; totalCount: number }>("/api/delivery/shifts", {
    params,
  })
  return data?.data ?? []
}

/** Detalle del turno con el libro de efectivo (movimientos por orden de fecha). */
export async function getShiftDetail(shiftId: string): Promise<DeliveryShiftDetailDto> {
  const { data } = await api.get<DeliveryShiftDetailDto>(`/api/delivery/shifts/${shiftId}`)
  return data
}

/** Entrega de más base durante el turno (aumenta el dinero esperado en mano). */
export async function addExtraBase(
  shiftId: string,
  payload: DeliveryMovementRequestDto
): Promise<DeliveryShiftMovementDto> {
  const { data } = await api.post<DeliveryShiftMovementDto>(`/api/delivery/shifts/${shiftId}/extra-base`, payload)
  return data
}

/** Recogida parcial del dinero del domiciliario (reduce el dinero esperado en mano). */
export async function addPartialPickup(
  shiftId: string,
  payload: DeliveryMovementRequestDto
): Promise<DeliveryShiftMovementDto> {
  const { data } = await api.post<DeliveryShiftMovementDto>(`/api/delivery/shifts/${shiftId}/pickups`, payload)
  return data
}

/** Finalizar turno: devuelve el turno cerrado con el cuadre. */
export async function closeShift(shiftId: string): Promise<DeliveryShiftDto> {
  const { data } = await api.post<DeliveryShiftDto>(`/api/delivery/shifts/${shiftId}/close`, {})
  return data
}

/**
 * Registrar la entrega de un pedido asignado: cobro del comprador (pago mixto o
 * cambio de medio), movimiento en el turno y decisión de devolución del anticipo.
 */
export async function deliverOrder(orderId: string, payload: DeliverOrderDto): Promise<DeliverOrderResponseDto> {
  const { data } = await api.post<DeliverOrderResponseDto>(`/api/orders/${orderId}/deliver`, payload)
  return data
}

/** Configuración de domicilios de la sucursal (base, % valor de domicilio, modelo de anticipo). */
export async function getBranchDeliverySettings(branchId: string): Promise<BranchDeliverySettingsDto> {
  const { data } = await api.get<BranchDeliverySettingsDto>(`/api/branches/${branchId}/delivery-settings`)
  return data
}

export async function updateBranchDeliverySettings(
  branchId: string,
  payload: UpdateBranchDeliverySettingsDto
): Promise<BranchDeliverySettingsDto> {
  const { data } = await api.put<BranchDeliverySettingsDto>(`/api/branches/${branchId}/delivery-settings`, payload)
  return data
}
