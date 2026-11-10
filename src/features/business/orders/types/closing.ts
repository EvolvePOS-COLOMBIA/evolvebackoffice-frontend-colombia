/**
 * Tipos del cierre de órdenes (F6) — espejo de los DTOs del backend.
 * El cierre documenta/cuadra; el cobro real ocurre fuera del POS.
 */

export interface BranchSchedule {
  openingTime: string // "HH:mm:ss"
  closingTime: string
}

export interface OrderClosingWindow {
  windowStartUtc: string
  windowEndUtc: string
  windowStartLocal: string
  windowEndLocal: string
  openingTime: string
  closingTime: string
  timeZone: string
}

export interface OrderClosingBreakdownRow {
  origin: string
  status: string
  paymentMethod: string
  count: number
  total: number
}

export interface OrderClosingOrderRow {
  id: string
  reference: string
  origin: string
  status: string
  declaredPaymentMethod: string | null
  customerName: string | null
  total: number
  createdAt: string
  reconciled: boolean
  reconcilePaymentMethodCode: string | null
  reconciledAt: string | null
}

export interface OrderClosingPreview {
  branchId: string
  branchName: string
  window: OrderClosingWindow
  ordersCount: number
  totalAmount: number
  breakdown: OrderClosingBreakdownRow[]
  orders: OrderClosingOrderRow[]
  alreadyClosedCount: number
}

export interface OrderClosing {
  id: string
  branchId: string
  branchName: string
  windowStart: string
  windowEnd: string
  ordersCount: number
  totalAmount: number
  reconciledCount: number
  breakdown: OrderClosingBreakdownRow[]
  notes: string | null
  closedBy: string
  closedAt: string
}

export interface OrderClosingDetail {
  closing: OrderClosing
  orders: OrderClosingOrderRow[]
}
