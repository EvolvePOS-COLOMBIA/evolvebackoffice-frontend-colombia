import type { DeliveryOrder } from "./delivery"

export interface CourierAvailability {
  id: string
  name: string
  onDuty: boolean
  load: number
  deliveredCount: number
  averageDeliveryMinutes: number | null
}
export interface CourierShift {
  id: string
  courierId: string
  courierName: string
  branchId: string
  openingCash: number
  startedAt: string
  settledAt: string | null
  expectedCash: number
  returnedCash: number | null
  tipsTotal: number
  deliveredCount: number
  averageDeliveryMinutes: number | null
}
export interface WebhookHealth {
  integrationId: string
  branchId: string
  branchName: string
  lastReceivedAt: string | null
  storeActive: boolean | null
  quiet: boolean
  paymentMethodMappings: Record<string, string>
}
export interface UnlinkedProduct {
  integrationId: string
  externalItemId: string
  name: string
  sku: string | null
  ordersCount: number
}
export interface DeliveryOperations {
  couriers: CourierAvailability[]
  shifts: CourierShift[]
  unlinkedProducts: UnlinkedProduct[]
  webhooks: WebhookHealth[]
}
export interface CourierMobile {
  runs?: import("./enhancements").DeliveryRun[]
  courierName: string
  shift: CourierShift
  orders: DeliveryOrder[]
}
