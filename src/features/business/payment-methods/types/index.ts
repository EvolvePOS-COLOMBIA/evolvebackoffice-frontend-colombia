/**
 * DTOs de `/api/payment-methods` (catálogo de medios de pago del tenant).
 * El `code` es inmutable en backend (lo referencian líneas de pago e informes).
 */
export const PAYMENT_METHOD_CATEGORIES = [
  "Cash",
  "Transfer",
  "CardDebit",
  "CardCredit",
  "Wallet",
  "Voucher",
  "Online",
  "Credit",
] as const

export type PaymentMethodCategory = (typeof PAYMENT_METHOD_CATEGORIES)[number]

export interface PaymentMethodResponseDto {
  id: string
  code: string
  name: string
  category: PaymentMethodCategory
  requiresReference: boolean
  requiresAuthCode: boolean
  isCash: boolean
  allowsOffline: boolean
  allowsInTerminal: boolean
  dianCode: string | null
  iconKey: string | null
  sortOrder: number
  isActive: boolean
  isCountryDefault: boolean
  createdAt: string
}

export interface CreatePaymentMethodDto {
  code: string
  name: string
  category: PaymentMethodCategory
  requiresReference: boolean
  requiresAuthCode: boolean
  isCash: boolean
  allowsOffline: boolean
  allowsInTerminal: boolean
  dianCode?: string | null
  iconKey?: string | null
  sortOrder: number
}

export type UpdatePaymentMethodDto = Omit<CreatePaymentMethodDto, "code">
