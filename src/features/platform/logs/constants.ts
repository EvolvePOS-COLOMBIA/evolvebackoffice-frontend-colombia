import type { BadgeTone } from "@/components/ui/badge"
import type { SystemLogServiceStatus, SystemLogLevel } from "./types"

/** Color del badge según el nivel del evento. */
export const LEVEL_TONE: Record<SystemLogLevel, BadgeTone> = {
  Fatal: "danger",
  Error: "danger",
  Warning: "warning",
  Information: "info",
  Debug: "neutral",
}

/** Claves i18n de cada nivel (uniones literales para el tipado de t()). */
export const LEVEL_LABEL_KEY = {
  Fatal: "level_Fatal",
  Error: "level_Error",
  Warning: "level_Warning",
  Information: "level_Information",
  Debug: "level_Debug",
} as const

/** Color del badge según el estado del servicio. */
export const STATUS_TONE: Record<SystemLogServiceStatus, BadgeTone> = {
  unknown: "neutral",
  healthy: "success",
  degraded: "warning",
  critical: "danger",
}

export const STATUS_LABEL_KEY = {
  unknown: "status_unknown",
  healthy: "status_healthy",
  degraded: "status_degraded",
  critical: "status_critical",
} as const

/** Niveles ofrecidos en el filtro (de más severo a menos). */
export const LOG_LEVELS: SystemLogLevel[] = ["Fatal", "Error", "Warning", "Information", "Debug"]
