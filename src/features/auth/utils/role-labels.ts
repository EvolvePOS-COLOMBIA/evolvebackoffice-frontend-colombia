import type { AppRole } from "@/features/auth/types"

/**
 * Claves i18n (namespace "common") para los roles que pueden aparecer en el
 * menú de usuario y el perfil: los AppRole de sesión y los roles de tenant que
 * devuelve GET /api/Users/{id} ("Admin" | "Manager" | "Cashier" | "Delivery").
 */
export const ROLE_LABEL_KEYS: Record<string, string> = {
  PlatformAdmin: "role_platform_admin",
  PlatformSubAdmin: "role_platform_sub_admin",
  PlatformSupervisor: "role_platform_supervisor",
  BusinessAdmin: "role_business_admin",
  Delivery: "role_delivery",
  Admin: "role_admin",
  Manager: "role_manager",
  Cashier: "role_cashier",
}

const ROLE_LABEL_KEYS_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABEL_KEYS).map(([role, key]) => [role.toLowerCase(), key])
)

export function getRoleLabelKey(role: AppRole | string | null | undefined): string | null {
  if (!role) return null
  return ROLE_LABEL_KEYS_LOWER[role.toLowerCase()] ?? null
}
