/**
 * Opciones de zona horaria IANA para los formularios de tenant.
 * Usa Intl.supportedValuesOf("timeZone") (lista del navegador, ~410 zonas)
 * con fallback a una lista común si el runtime no lo soporta.
 */
const FALLBACK_TIME_ZONES = [
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Guayaquil",
  "America/La_Paz",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Panama",
  "America/Costa_Rica",
  "America/El_Salvador",
  "America/Guatemala",
  "America/Tegucigalpa",
  "America/Managua",
  "America/Havana",
  "America/Santo_Domingo",
  "America/Puerto_Rico",
  "Europe/Madrid",
  "UTC",
]

/** Sentinel usado en el Select para volver a "automático según país" (vacío). */
export const TIME_ZONE_AUTO = "__auto"

export function getTimeZoneOptions(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    if (typeof intl.supportedValuesOf === "function") {
      const zones = intl.supportedValuesOf("timeZone")
      if (Array.isArray(zones) && zones.length > 0) return zones
    }
  } catch {
    // runtime sin soporte → fallback
  }
  return FALLBACK_TIME_ZONES
}
