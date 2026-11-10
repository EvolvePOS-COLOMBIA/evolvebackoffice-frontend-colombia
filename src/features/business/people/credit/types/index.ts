/**
 * Tipos del crédito de tienda (fiado) — espejo de los DTOs del backend (F3).
 * El cupo es POR PERSONA: la misma fila alimenta clientes, empleados y
 * proveedores que compartan la persona.
 */
export interface PersonCreditResponseDto {
  personId: string
  isActive: boolean
  creditLimit: number
  balance: number
  available: number
  activatedAt: string | null
  pinConfigured: boolean
  isLocked: boolean
  pinAttempts: number
  email: string | null
}

export interface CreditMovementDto {
  id: string
  type: "Authorization" | "Payment"
  amount: number
  balanceAfter: number
  authorizationCode: string | null
  expiresAt: string | null
  settledAt: string | null
  settledTransactionId: string | null
  cancelledAt: string | null
  paymentMethodCode: string | null
  reference: string | null
  notes: string | null
  createdAt: string
}

export interface CreditHistoryResult {
  items: CreditMovementDto[]
  totalCount: number
}

/** Autorización de crédito aún no liquidada (venta pendiente de sincronizar). */
export interface PendingAuthorizationDto {
  id: string
  personId: string
  personName: string
  amount: number
  authorizationCode: string
  createdAt: string
  expiresAt: string | null
  isExpired: boolean
}

export interface CreditActivationResult {
  account: PersonCreditResponseDto
  pinDeliveryError: string | null
}
