import type { BadgeTone } from "@/components/ui/badge"

export type {
  OrderListItem,
  OrderDetail,
  OrderItemDto,
  PagedOrders,
  OrderStatus,
  CancellationType,
  CancelOrderDto,
  CancelOrderItemDispositionDto,
  CluviStoreInfo,
  CluviMenuProduct,
  CluviMenuCategory,
  CluviMenuModifier,
  CluviModifierItem,
} from "./api"

/** `labelKey` is an i18n key of the `business-orders` namespace. */
export const ORDER_STATUS_CONFIG: Record<string, { labelKey: string; color: BadgeTone; bgClass: string }> = {
  Pending: { labelKey: "order_status_pending", color: "warning", bgClass: "bg-amber-50 border-amber-200" },
  Confirmed: { labelKey: "order_status_confirmed", color: "info", bgClass: "bg-blue-50 border-blue-200" },
  Preparing: { labelKey: "order_status_preparing", color: "purple", bgClass: "bg-purple-50 border-purple-200" },
  Ready: { labelKey: "order_status_ready", color: "success", bgClass: "bg-emerald-50 border-emerald-200" },
  Shipped: { labelKey: "order_status_shipped", color: "primary", bgClass: "bg-indigo-50 border-indigo-200" },
  Delivered: { labelKey: "order_status_delivered", color: "success", bgClass: "bg-green-50 border-green-200" },
  Cancelled: { labelKey: "order_status_cancelled", color: "danger", bgClass: "bg-red-50 border-red-200" },
  NeedsReview: { labelKey: "order_status_needs_review", color: "orange", bgClass: "bg-orange-50 border-orange-200" },
  Refunded: { labelKey: "order_status_refunded", color: "neutral", bgClass: "bg-slate-50 border-slate-200" },
}

export const KANBAN_COLUMNS = ["Pending", "Confirmed", "Preparing", "Ready", "Shipped", "Delivered"] as const

/** Etiqueta i18n de cada origen controlado (enum OrderOrigin del backend). */
export const ORDER_ORIGIN_LABEL_KEY: Record<string, string> = {
  WhatsApp: "origin_whatsapp",
  Facebook: "origin_facebook",
  Call: "origin_call",
  Others: "origin_other",
  Cluvi: "origin_cluvi",
  WooCommerce: "origin_woocommerce",
}
