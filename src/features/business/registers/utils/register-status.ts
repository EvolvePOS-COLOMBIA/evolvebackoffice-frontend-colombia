import type { RegisterStatus, SerialCodeSummaryDto } from "@/features/business/registers/types"

export type BadgeTone = "success" | "danger" | "warning" | "neutral"

export function registerStatusTone(status: RegisterStatus): BadgeTone {
  switch (status) {
    case "Active":
      return "success"
    case "Locked":
      return "danger"
    case "Maintenance":
      return "warning"
    default:
      return "neutral"
  }
}

export function registerStatusKey(status: RegisterStatus): string {
  switch (status) {
    case "Active":
      return "status_active"
    case "Locked":
      return "status_locked"
    case "Maintenance":
      return "status_maintenance"
    default:
      return "status_inactive"
  }
}

/** Estados reales de PosSerialCode: Unassigned | Activated | Decommissioned. */
export function serialStatusTone(status: SerialCodeSummaryDto["status"]): BadgeTone {
  switch (status) {
    case "Activated":
      return "success"
    case "Unassigned":
      return "warning"
    default:
      return "neutral"
  }
}

export function serialStatusKey(status: SerialCodeSummaryDto["status"]): string {
  switch (status) {
    case "Activated":
      return "serial_status_activated"
    case "Unassigned":
      return "serial_status_unassigned"
    default:
      return "serial_status_decommissioned"
  }
}

/**
 * Un serial asignado a una caja ya no está libre aunque el backend siga marcándolo "Unassigned"
 * (pasa a "Activated" solo cuando el dispositivo lo activa).
 */
export function summarizeSerials(serials: SerialCodeSummaryDto[]): { available: number; inUse: number } {
  let available = 0
  let inUse = 0
  for (const s of serials) {
    if (s.status === "Decommissioned") continue
    if (s.status === "Activated" || s.isAssignedToRegister) inUse += 1
    else available += 1
  }
  return { available, inUse }
}

/** Filtro local del pool de seriales (el endpoint no pagina ni busca). */
export function filterSerials(serials: SerialCodeSummaryDto[], query: string): SerialCodeSummaryDto[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return serials
  return serials.filter((s) =>
    [s.serialCode, s.deviceName, s.registerName, s.registerCode].some((value) =>
      (value ?? "").toLowerCase().includes(needle)
    )
  )
}
