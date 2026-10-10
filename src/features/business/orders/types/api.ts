export interface OrderListItem {
  id: string
  externalOrderId: string | null
  platformCode: string
  /** Origen controlado (OrderOrigin): WhatsApp, Facebook, Call, Others, Cluvi, WooCommerce. */
  origin?: string | null
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
  fulfillmentType?: string | null
  paymentConfirmed?: boolean
  tipAmount?: number
  mappedPaymentMethodCode?: string | null
  outboundSyncError?: string | null
  externalCreatedAt: string
  externalUpdatedAt: string | null
  createdAt: string
  shippingCity: string | null
  shippingStreet: string | null
  /** Domiciliario asignado (null = sin asignar). */
  courierId?: string | null
  courierName?: string | null
  assignedAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
}

export interface OrderDetail {
  id: string
  externalOrderId: string | null
  platformCode: string
  /** Origen controlado (OrderOrigin). */
  origin?: string | null
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
  fulfillmentType?: string | null
  paymentConfirmed?: boolean
  tipAmount?: number
  mappedPaymentMethodCode?: string | null
  outboundSyncError?: string | null
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
  courierId?: string | null
  courierName?: string | null
  assignedAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
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

/** Disponibilidad de un ítem de la orden contra el inventario de la sucursal. */
export interface OrderStockItem {
  itemId: string | null
  name: string
  sku: string | null
  requested: number
  available: number
  tracksInventory: boolean
  sufficient: boolean
}

/** Resultado de GET /api/orders/{id}/stock-check (solo informativo). */
export interface OrderStockCheck {
  hasShortage: boolean
  items: OrderStockItem[]
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

/** Actualización de una integración existente (los secretos solo se envían con su flag SetNew*). */
export interface UpdateIntegrationDto {
  isActive?: boolean | null
  baseUrl?: string | null
  setNewApiKey: boolean
  apiKey?: string | null
  setNewApiSecret: boolean
  apiSecret?: string | null
  setNewConsumerKey: boolean
  consumerKey?: string | null
  setNewConsumerSecret: boolean
  consumerSecret?: string | null
  settingsJson?: string | null
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

/** Orden nueva detectada por el long-poll de notificaciones. */
export interface NewOrderNotice {
  id: string
  platformCode: string
  externalOrderId: string
  customerName: string | null
  branchName: string | null
  total: number
  status: string
  createdAt: string
}

/** Respuesta de GET /api/orders/updates (long-poll de órdenes nuevas). */
export interface NewOrdersUpdate {
  data: NewOrderNotice[]
  /** Cursor superior: usar como sinceUtc de la siguiente llamada. */
  nowUtc: string
}

/** Línea de producto en la creación manual de una orden. */
export interface CreateManualOrderItemDto {
  itemPublicId: string
  quantity: number
  /** null = usa el precio de la sucursal (BranchItem.Price). */
  unitPriceOverride: number | null
  tax: number | null
  discount: number | null
  modifiersJson: string | null
  notes: string | null
}

/** Payload de POST /api/orders (creación manual: caja / domicilio). */
export interface CreateManualOrderDto {
  automaticShipping?: boolean
  customerName?: string | null
  customerPhone?: string | null
  branchId: string
  customerId: string | null
  personId: string | null
  paymentMethod: string
  /** Pending | Confirmed | NeedsReview */
  status: string
  /** Origen controlado (OrderOrigin) de la orden manual; null = sin origen. */
  origin: string | null
  notes: string | null
  shippingStreet: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZipCode: string | null
  shippingLatitude: number | null
  shippingLongitude: number | null
  shippingNotes: string | null
  tax: number | null
  discount: number | null
  shippingCost: number | null
  items: CreateManualOrderItemDto[]
}

/** Payload de PUT /api/orders/{id}/details — null = no modificar el campo. */
export interface UpdateOrderDetailsDto {
  notes: string | null
  shippingStreet: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZipCode: string | null
  shippingLatitude: number | null
  shippingLongitude: number | null
  shippingNotes: string | null
  shippingCost: number | null
}
