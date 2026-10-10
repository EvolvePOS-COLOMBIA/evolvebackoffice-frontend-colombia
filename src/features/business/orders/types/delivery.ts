/**
 * Domicilios: domiciliarios (repartidores) y vista de domicilios del día —
 * espejo de los DTOs del backend (CourierDtos.cs).
 */

export interface Courier {
  id: string
  name: string
  phone: string | null
  documentNumber: string | null
  vehiclePlate: string | null
  notes: string | null
  /** null = atiende todas las sucursales. */
  branchId: string | null
  branchName: string | null
  isActive: boolean
  createdAt: string
}

export interface PagedCouriers {
  data: Courier[]
  totalCount: number
  totalPages: number
}

export interface DeliveryOrder {
  id: string
  reference: string
  platformCode: string
  origin: string | null
  status: "Ready" | "Shipped" | "Delivered" | string
  branchId: string | null
  branchName: string | null
  customerName: string | null
  customerPhone: string | null
  shippingStreet: string | null
  shippingCity: string | null
  shippingNotes: string | null
  shippingLatitude: number | null
  shippingLongitude: number | null
  total: number
  shippingCost: number
  paymentMethod: string | null
  createdAt: string
  assignedAt: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  fulfillmentType?: string | null
  paymentConfirmed?: boolean
  isReconciled?: boolean
  hasDeliveryProof?: boolean
  tipAmount?: number
  mappedPaymentMethodCode?: string | null
  cashTenderedAmount?: number | null
  changeToCarry?: number
  readyAt?: string | null
  promisedDeliveryAt?: string | null
  deliveryFailureReason?: string | null
  cancelledWhileDispatched?: boolean
  syncStatus?: "Synced" | "Pending" | "Error"
  syncError?: string | null
}

export interface DeliveryCourierGroup {
  courierId: string
  name: string
  phone: string | null
  readyCount: number
  onTheWayCount: number
  deliveredCount: number
  /** Total de los pedidos aún no entregados (lo que lleva por cobrar). */
  pendingToCollect: number
  orders: DeliveryOrder[]
}

export interface DeliveryBoard {
  branchId: string | null
  date: string
  timeZone: string
  couriers: DeliveryCourierGroup[]
  /** Pedidos Listos sin domiciliario asignado. */
  unassigned: DeliveryOrder[]
}
