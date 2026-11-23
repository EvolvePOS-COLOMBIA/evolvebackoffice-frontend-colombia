/** Solo dígitos (el número debe traer el indicativo del país). */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/**
 * Número de WhatsApp válido: entre 8 y 15 dígitos con indicativo; se aceptan
 * espacios, guiones, paréntesis y "+" (misma regla que el backend).
 */
export function isValidWhatsAppNumber(value: string): boolean {
  if (!value.trim() || /[^\d\s()+-]/.test(value)) return false
  const digits = phoneDigits(value).length
  return digits >= 8 && digits <= 15
}

/** `573001234567` → `+573001234567` (vacío si no hay número). */
export function formatWhatsAppNumber(digits: string | null | undefined): string {
  return digits ? `+${digits}` : ""
}
