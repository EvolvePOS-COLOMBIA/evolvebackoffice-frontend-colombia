import type { OrderListItem, OrderDetail, CancellationType, OrderItemDto } from "../types"

/** Mensaje de error del backend (`{ message }` o `{ error }`) o un genérico. */
export function getApiErrorMessage(error: unknown, fallback = "Error"): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response
    return response?.data?.message ?? response?.data?.error ?? fallback
  }
  return fallback
}

/** Enlace de Google Maps a la dirección (coordenadas si existen, si no el texto). */
export function mapsUrl(order: {
  shippingLatitude: number | null
  shippingLongitude: number | null
  shippingStreet: string | null
  shippingCity: string | null
}): string | null {
  if (order.shippingLatitude != null && order.shippingLongitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${order.shippingLatitude},${order.shippingLongitude}`
  }
  const address = [order.shippingStreet, order.shippingCity].filter(Boolean).join(", ")
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null
}

/** Minutos transcurridos desde `iso` hasta `now` (null si no hay fecha). */
export function minutesSince(iso: string | null, now: number): number | null {
  if (!iso) return null
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))
}

/**
 * Tiempo transcurrido legible: minutos hasta 1 h, horas y minutos hasta 1 día
 * y días después (un pedido olvidado no se muestra como "hace 16958 min").
 */
export function elapsedLabelParts(
  minutes: number
):
  | { key: "elapsed_minutes"; count: number }
  | { key: "elapsed_hours"; hours: number; minutes: number }
  | { key: "elapsed_days"; count: number } {
  if (minutes < 60) return { key: "elapsed_minutes", count: minutes }
  if (minutes < 24 * 60) return { key: "elapsed_hours", hours: Math.floor(minutes / 60), minutes: minutes % 60 }
  return { key: "elapsed_days", count: Math.floor(minutes / (24 * 60)) }
}

/** Estructura del estado inicial del formulario de cancelación. */
export interface CancelOrderInitialState {
  /** Disposición global por defecto. */
  cancellationType: CancellationType
  /** Si debe activarse el modo por producto de entrada. */
  customPerItem: boolean
  /** Mapa de disposición específica por ID de ítem. */
  itemDispositions: Record<string, CancellationType>
  /** Motivo inicial escrito por el usuario. */
  reason: string
}

/**
 * Detecta si el producto es una bebida o líquido sellado por su nombre.
 * Utiliza normalización Unicode y límites de palabra (\b) para evitar clasificar
 * erróneamente alimentos como "Steak" (tea), "Aguacate" (agua), "Pizza cuatro quesos" (cuatro) o "Paté" (té).
 */
export function isBeverage(name: string): boolean {
  if (!name) return false

  const clean = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  return /\b(coca|pepsi|gaseosa|bebida|agua|jugo|cerveza|soda|sprite|fanta|postobon|quatro|te|tea|refresco|lata|botella|corona|heineken|poker|aguila|club colombia)\b/i.test(
    clean
  )
}

/**
 * Construye el estado inicial para la cancelación de una orden.
 * Si la orden ya está en preparación, lista o enviada, sugiere merma por defecto,
 * clasificando bebidas selladas hacia reabastecimiento (Restocked).
 */
export function buildCancellationInitialState(
  order: OrderListItem | OrderDetail,
  items: OrderItemDto[]
): CancelOrderInitialState {
  const isWasteDefault =
    order.statusCode === "Preparing" || order.statusCode === "Ready" || order.statusCode === "Shipped"

  const initialMap: Record<string, CancellationType> = {}
  let hasBeverage = false

  if (items.length > 0) {
    items.forEach((item) => {
      if (isWasteDefault) {
        if (isBeverage(item.name)) {
          initialMap[item.id] = "Restocked"
          hasBeverage = true
        } else {
          initialMap[item.id] = "Waste"
        }
      } else {
        initialMap[item.id] = "Restocked"
      }
    })
  }

  const shouldSuggestCustom = isWasteDefault && hasBeverage && items.length > 1

  return {
    cancellationType: isWasteDefault ? "Waste" : "Restocked",
    customPerItem: shouldSuggestCustom,
    itemDispositions: initialMap,
    reason: "",
  }
}
