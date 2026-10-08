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

/** Pago (medio de cobro) asignado a una orden al conciliar. */
export interface OrderPayment {
  id: string
  paymentMethodCode: string
  paymentMethodName: string | null
  amount: number
  reference: string | null
  createdAt: string
  /** Efectivo que entregó el cliente (solo medios en efectivo). */
  tenderedAmount: number | null
  /** Cambio devuelto: tenderedAmount − amount. */
  changeAmount: number
}

/** Línea enviada al conciliar una orden (la suma debe dar el total). */
export interface ReconcilePaymentLine {
  paymentMethodCode: string
  amount: number
  reference?: string | null
  tenderedAmount?: number | null
}

/** Totales por medio de pago del periodo (esperado / antes / actual). */
export interface PaymentTotalsRow {
  paymentMethodCode: string
  paymentMethodName: string
  expectedAmount: number
  expectedCount: number
  baselineAmount: number
  baselineCount: number
  currentAmount: number
  currentCount: number
}

/** Lo que cada domiciliario debe devolver a caja en el periodo. */
export interface CourierSettlementRow {
  /** null = pedidos a domicilio sin domiciliario asignado. */
  courierId: string | null
  courierName: string
  ordersCount: number
  deliveredCount: number
  ordersTotal: number
  /** Informativo. */
  shippingTotal: number
  /** Efectivo conciliado que entrega en caja (el cambio ya se devolvió al cliente). */
  cashToReturn: number
  changeGiven: number
  otherMethodsTotal: number
  unreconciledTotal: number
}

export interface ReconcileOrderResponse {
  orderId: string
  reconciled: boolean
  reconcilePaymentMethodCode: string | null
  payments: OrderPayment[]
  totals: PaymentTotalsRow[]
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
  payments?: OrderPayment[] | null
  courierId?: string | null
  courierName?: string | null
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
  date?: string
  status?: string
  /** Periodo actual o inmediatamente anterior: se puede conciliar. */
  editable?: boolean
  paymentTotals?: PaymentTotalsRow[] | null
  courierSettlements?: CourierSettlementRow[] | null
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
  status?: string
  editable?: boolean
  paymentTotals?: PaymentTotalsRow[] | null
  courierSettlements?: CourierSettlementRow[] | null
}

export interface OrderClosingDetail {
  closing: OrderClosing
  orders: OrderClosingOrderRow[]
}
