/**
 * Extrae el mensaje de error devuelto por el backend (`{ message }` o
 * `{ error }`) desde una excepción de axios, usando `fallback` cuando no hay
 * detalle utilizable. Evita mostrar "Request failed with status code 400".
 */
type ApiErrorPayload = { message?: string; error?: string }

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: ApiErrorPayload | string } }).response?.data
    if (typeof data === "object" && data !== null) {
      const message = data.message ?? data.error
      if (typeof message === "string" && message.trim()) return message
    }
  }
  return fallback
}
