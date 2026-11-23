/** Código del módulo de plataforma que habilita el WhatsApp del negocio. */
export const WHATSAPP_MODULE_CODE = "WHATSAPP"

export type WhatsAppConnectionStatus = "NotConnected" | "Connecting" | "Connected"

/** GET /api/whatsapp — números en dígitos con indicativo (ej. 573001234567). */
export type WhatsAppStatus = {
  /** El servidor de WhatsApp está configurado en el backend. */
  configured: boolean
  status: WhatsAppConnectionStatus
  /** No se pudo consultar el servidor; `status` es el último conocido. */
  statusCheckFailed: boolean
  phoneNumber: string | null
  connectedNumber: string | null
  profileName: string | null
  connectedAt: string | null
  rejectCalls: boolean
}

/** QR (data URI) y código de vinculación; sin QR cuando ya quedó conectado. */
export type WhatsAppQr = {
  status: WhatsAppConnectionStatus
  qrCode: string | null
  pairingCode: string | null
}

/** El mensaje al rechazar una llamada es fijo (lo define el backend). */
export type UpdateWhatsAppSettingsPayload = {
  rejectCalls: boolean
}
