import type { BadgeTone } from "@/components/ui/badge"

/**
 * Acciones del enum AuditAction (backend). El listado se muestra en crudo
 * (audiencia técnica: administradores de plataforma); este array alimenta el
 * combo de filtrado.
 */
export const AUDIT_ACTIONS: string[] = [
  "EntityCreated",
  "EntityUpdated",
  "EntityDeleted",
  "Login",
  "LoginPos",
  "LoginFailed",
  "ChangePassword",
  "PasswordReset",
  "OrderUpdated",
  "OrderCancelled",
  "OrderClosed",
  "OrderReconciled",
  "OrderUnreconciled",
  "OrderPaymentsChanged",
  "BranchScheduleUpdated",
  "TenantCreated",
  "TenantUpdated",
  "TenantActivated",
  "DeactivateTenant",
  "TenantDeactivated",
  "DeleteTenant",
  "TenantDeleted",
  "UserCreated",
  "UserUpdated",
  "UserDeactivated",
  "UserActivated",
  "DecommissionSerial",
  "SerialDecommissioned",
  "InvoiceCancelled",
  "StockAdjusted",
  "DeviceRevoked",
  "PasswordChanged",
  "Logout",
  "Generic",
  "Other",
]

const ACTION_TONE: Record<string, BadgeTone> = {
  EntityCreated: "success",
  EntityUpdated: "info",
  EntityDeleted: "danger",
  Login: "info",
  LoginPos: "info",
  LoginFailed: "danger",
  ChangePassword: "info",
  PasswordReset: "warning",
  PasswordChanged: "info",
  OrderUpdated: "info",
  OrderCancelled: "danger",
  OrderClosed: "success",
  OrderReconciled: "info",
  OrderUnreconciled: "warning",
  OrderPaymentsChanged: "info",
  TenantCreated: "success",
  TenantActivated: "success",
  DeactivateTenant: "warning",
  TenantDeactivated: "warning",
  DeleteTenant: "danger",
  TenantDeleted: "danger",
  UserActivated: "success",
  UserDeactivated: "warning",
  DecommissionSerial: "warning",
  SerialDecommissioned: "warning",
  InvoiceCancelled: "danger",
  StockAdjusted: "warning",
  DeviceRevoked: "warning",
  Generic: "neutral",
  Other: "neutral",
}

/** Color del badge de acción; fallback según el resultado del evento. */
export function actionTone(action: string, succeeded: boolean): BadgeTone {
  return ACTION_TONE[action] ?? (succeeded ? "neutral" : "danger")
}

/** Color del badge de tipo de actor. */
export function actorTypeTone(actorType: string): BadgeTone {
  switch (actorType) {
    case "PlatformAdmin":
      return "info"
    case "TenantUser":
      return "neutral"
    case "PosTerminal":
      return "warning"
    default:
      return "neutral"
  }
}
