import type { RouteNotification } from "../types/api"

export type RouteNotificationToast = {
  tone: "success" | "info" | "error"
  /** Clave i18n del namespace business-orders. */
  key: string
  params: { name: string; count: number }
}

/**
 * Traduce el resultado del envío de la ruta por WhatsApp a un toast. Devuelve
 * null cuando no hay nada que avisar (módulo WHATSAPP apagado o servidor sin
 * configurar: `Skipped` sin mensaje).
 */
export function routeNotificationToast(
  notification: RouteNotification | null | undefined
): RouteNotificationToast | null {
  if (!notification) return null
  const params = { name: notification.deliveryUserName ?? "", count: notification.ordersCount }
  switch (notification.status) {
    case "Sent":
      return { tone: "success", key: "route_sent", params }
    case "NoPhone":
      return { tone: "info", key: "route_no_phone", params }
    case "NotConnected":
      return { tone: "info", key: "route_not_connected", params }
    case "Failed":
      return { tone: "error", key: "route_failed", params }
    case "Skipped":
      return notification.message ? { tone: "info", key: "route_no_courier", params } : null
    default:
      return null
  }
}
