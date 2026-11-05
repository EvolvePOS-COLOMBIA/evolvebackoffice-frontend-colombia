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

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: BadgeTone; bgClass: string }> = {
  Pending: { label: "Pendiente", color: "warning", bgClass: "bg-amber-50 border-amber-200" },
  Confirmed: { label: "Confirmado", color: "info", bgClass: "bg-blue-50 border-blue-200" },
  Preparing: { label: "Preparando", color: "purple", bgClass: "bg-purple-50 border-purple-200" },
  Ready: { label: "Listo", color: "success", bgClass: "bg-emerald-50 border-emerald-200" },
  Shipped: { label: "En Camino", color: "primary", bgClass: "bg-indigo-50 border-indigo-200" },
  Delivered: { label: "Entregado", color: "success", bgClass: "bg-green-50 border-green-200" },
  Cancelled: { label: "Cancelado", color: "danger", bgClass: "bg-red-50 border-red-200" },
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
