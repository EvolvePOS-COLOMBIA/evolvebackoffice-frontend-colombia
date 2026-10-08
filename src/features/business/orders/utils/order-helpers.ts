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
