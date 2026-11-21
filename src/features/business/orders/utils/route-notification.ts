import type { RouteNotification } from "../types/api"

export type RouteNotificationToast = {
  tone: "success" | "info" | "error"
  /** Clave i18n del namespace business-orders. */
  key: string
  params: { name: string; count: number }
}

/** `route`: ruta al asignar pedidos. `notice`: aviso de pedido entregado/cancelado. */
export type CourierMessageKind = "route" | "notice"

/**
 * Traduce el resultado del envío por WhatsApp al domiciliario a un toast. Devuelve
 * null cuando no hay nada que avisar (módulo WHATSAPP apagado, servidor sin
 * configurar o, en el aviso, pedido sin turno abierto: `Skipped`).
 */
export function routeNotificationToast(
  notification: RouteNotification | null | undefined,
  kind: CourierMessageKind = "route"
): RouteNotificationToast | null {
  if (!notification) return null
  const params = { name: notification.deliveryUserName ?? "", count: notification.ordersCount }
  const prefix = kind === "route" ? "route" : "courier_notice"
  switch (notification.status) {
    case "Sent":
      return { tone: "success", key: `${prefix}_sent`, params }
    case "NoPhone":
      return { tone: "info", key: `${prefix}_no_phone`, params }
    case "NotConnected":
      return { tone: "info", key: `${prefix}_not_connected`, params }
    case "Failed":
      return { tone: "error", key: `${prefix}_failed`, params }
    case "Skipped":
      return kind === "route" && notification.message ? { tone: "info", key: "route_no_courier", params } : null
    default:
      return null
  }
}
