export interface OrderListItem {
  id: string
  externalOrderId: string | null
  platformCode: string
  branchId: string | null
  branchName: string | null
  statusCode: string
  statusName: string
  subTotal: number
  tax: number
  discount: number
  shippingCost: number
  total: number
  paymentMethod: string | null
  externalCreatedAt: string
  externalUpdatedAt: string | null
  createdAt: string
  shippingCity: string | null
  shippingStreet: string | null
}

export interface OrderDetail {
  id: string
  externalOrderId: string | null
  platformCode: string
  branchId: string | null
  branchName: string | null
  customerId: string | null
  customerName: string | null
  personId: string | null
  personName: string | null
  statusCode: string
  statusName: string
  subTotal: number
  tax: number
  discount: number
  shippingCost: number
  total: number
  paymentMethod: string | null
  notes: string | null
  shippingStreet: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZipCode: string | null
  shippingLatitude: number | null
  shippingLongitude: number | null
  shippingNotes: string | null
  externalCreatedAt: string
  externalUpdatedAt: string | null
  needsOutboundSync: boolean
  items: OrderItemDto[]
}

export interface OrderItemDto {
  id: string
  nameSnapshot: string
  quantity: number
  unitPrice: number
  subtotal: number
  tax: number
  discount: number
  skuSnapshot: string | null
  externalItemId: string | null
  modifiersJson: string | null
}

export interface PagedOrders {
  data: OrderListItem[]
  totalCount: number
  totalPages: number
}

export type OrderStatus = "Pending" | "Confirmed" | "Preparing" | "Ready" | "Shipped" | "Delivered" | "Cancelled"

export interface BranchIntegration {
  id: string
  branchId: string
  platformCode: string
  isActive: boolean
  baseUrl: string
  settingsJson: string | null
  lastSyncedAtUtc: string | null
  lastSyncStatus: string
  lastError: string | null
}

export interface CreateIntegrationDto {
  platformCode: string
  isActive: boolean
  baseUrl: string
  apiKey?: string
  apiSecret?: string
  consumerKey?: string
  consumerSecret?: string
  settingsJson?: string
}

export interface CluviStoreInfo {
  id: number
  label: string
  customer: string
}

export interface CluviMenuProduct {
  pos_id: string
  label: string
  price: number
  sku: string
  active: boolean
  description: string
  category_id: string | null
  modifiers: string[]
  is_on_table: boolean
  is_delivery: boolean
  is_take_away: boolean
}

export interface CluviMenuCategory {
  pos_id: string
  label: string
  description: string
  order: number
}

export interface CluviMenuModifier {
  pos_id: string
  label: string
  max: number
  min: number
  type: string
  order: number
  items: CluviModifierItem[]
}

export interface CluviModifierItem {
  pos_id: string
  label: string
  active: boolean
  price: number
  sku: string
  order: number
}

export interface SyncMenuResponse {
  success: boolean
  message: string | null
  products: number
  categories: number
  modifiers: number
}

/** Respuesta de POST .../integrations/{id}/test-connection */
export interface TestConnectionResult {
  success: boolean
  message: string
  /** Estado de la tienda en Cluvi: "on" | "off" (null cuando no aplica). */
  storeStatus?: string | null
}

/** Respuesta de POST .../integrations/{id}/activate-store */
export interface ActivateStoreResult {
  success: boolean
  message: string | null
  storeStatus: string | null
  newOrderWebhookUrl: string | null
  pingWebhookUrl: string | null
}
