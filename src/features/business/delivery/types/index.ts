/**
 * Contratos del módulo de Domicilios (endpoints B14 + `delivery-settings` de B8b).
 * JSON camelCase; los enums viajan como strings PascalCase salvo `advanceMode`
 * (int: 0 = con anticipo, 1 = sin anticipo) y el estado del domiciliario
 * (`"active" | "inactive"` en minúsculas).
 */

/** Domiciliario = usuario con rol DELIVERY; `status` refleja si tiene turno abierto. */
export interface DeliveryDomiciliarioDto {
  userId: string
  fullName: string
  phoneNumber: string | null
  status: "active" | "inactive"
  /** Turno abierto (activo) o el último turno (inactivo). */
  shiftId: string | null
  baseAmount: number | null
  openedAt: string | null
  branchId: string | null
  branchName: string | null
}

export type DeliveryShiftStatus = "Open" | "Closed"

export interface DeliveryShiftDto {
  id: string
  branchId: string
  branchName: string | null
  userId: string
  domiciliarioName: string | null
  baseAmount: number
  status: DeliveryShiftStatus
  openedAt: string
  closedAt: string | null
  /** Dinero esperado en mano: suma viva de los movimientos (o cuadre si está cerrado). */
  expectedCash: number
  /** Lo que se deja al domiciliario (Σ valor del domicilio × %); 0 hasta el cierre. */
  deliveryShareTotal: number
  /** Dinero a entregar a la empresa; null hasta el cierre. */
  deliveryToCompany: number | null
}

export type DeliveryMovementType =
  | "BaseAssigned"
  | "ExtraBase"
  | "PartialPickup"
  | "OrderAdvance"
  | "DeliveryCollection"
  | "AdvanceRefund"

export interface DeliveryShiftMovementDto {
  id: string
  type: DeliveryMovementType
  amount: number
  /** Pedido vinculado al movimiento (Guid); null en base/recogidas. */
  orderId: string | null
  notes: string | null
  createdAt: string
}

export interface DeliveryShiftDetailDto {
  shift: DeliveryShiftDto
  movements: DeliveryShiftMovementDto[]
}

export interface ActivateDomiciliarioDto {
  branchId: string
  baseAmount?: number | null
}

export interface DeliveryMovementRequestDto {
  amount: number
  notes?: string | null
}

/** Pago parcial del comprador al entregar (pago mixto o cambio de medio). */
export interface DeliverPaymentDto {
  paymentMethodCode: string
  amount: number
  reference?: string | null
}

export interface DeliverOrderDto {
  /** Debe sumar exactamente el total del pedido. */
  payments: DeliverPaymentDto[]
  /** Devolver al domiciliario el anticipo (solo modelo con anticipo). */
  returnAdvance?: boolean
  /** Monto a devolver; default `total − efectivo recibido`. */
  advanceRefundAmount?: number | null
}

export interface DeliverOrderResponseDto {
  orderId: string
  status: string
  cashCollected: number
  advanceRefundRegistered: boolean
  advanceRefundAmount: number | null
}

/** Configuración de domicilios de la sucursal (`GET/PUT .../delivery-settings`). */
export interface BranchDeliverySettingsDto {
  id: string
  branchId: string
  /** Base por defecto al activar domiciliarios; null = pedirla al activar. */
  baseAmount: number | null
  /** % del valor del domicilio que se deja al domiciliario (default 100). */
  deliveryValuePercentage: number
  /** 0 = con anticipo, 1 = sin anticipo. */
  advanceMode: number
  createdAt: string
}

export interface UpdateBranchDeliverySettingsDto {
  baseAmount?: number | null
  deliveryValuePercentage?: number
  advanceMode?: number
}

/** Modelo de anticipo de la sucursal (`advanceMode` del wire). */
export const ADVANCE_MODE = { Advance: 0, NoAdvance: 1 } as const

/** Signo del movimiento en el libro de efectivo (dinero esperado en mano). */
export function movementSign(type: DeliveryMovementType): 1 | -1 {
  return type === "PartialPickup" || type === "OrderAdvance" ? -1 : 1
}
