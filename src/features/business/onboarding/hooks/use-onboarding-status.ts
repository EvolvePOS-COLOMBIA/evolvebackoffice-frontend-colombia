import { features } from "@/config/features"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useBranchesCount } from "@/features/business/branches/hooks/use-branches"
import { useAppStore } from "@/store/app-store"

import { isOnboardingForced } from "../dev-override"
import type { OnboardingStatus } from "../types"

/**
 * Única fuente de verdad sobre si un tenant tiene el onboarding pendiente.
 *
 * Hoy funciona con dos señales:
 *  1. `forcePasswordChange` de la sesión: si viene en true, el onboarding es
 *     obligatorio sí o sí (el usuario todavía tiene la contraseña temporal).
 *  2. Heurística: si el tenant no tiene ninguna sucursal, nunca se configuró.
 *     El resultado se cachea en el store por tenant para no repetir la consulta.
 *
 * Cuando el backend persista el estado en el tenant, encender
 * `features.onboardingStateApi` y reemplazar la heurística por esa consulta.
 * Ningún componente fuera de este archivo debería enterarse.
 */
export function useOnboardingStatus(): OnboardingStatus {
  const { session, tenantId } = useAuth()
  const completedMap = useAppStore((state) => state.onboardingCompleted)

  const localCompleted = tenantId ? Boolean(completedMap[tenantId]) : false
  const forcePasswordChange = session?.forcePasswordChange ?? false
  const forcedByDev = isOnboardingForced()

  // La consulta queda apagada si ya sabemos localmente que terminó, o si el
  // cambio de contraseña obligatorio ya decide por sí solo.
  const shouldCheckBranches = !localCompleted && !forcePasswordChange && !forcedByDev
  const branchesQuery = useBranchesCount(tenantId, shouldCheckBranches)

  // Override de desarrollo: gana sobre todo lo demás. Ver `dev-override.ts`.
  if (forcedByDev) {
    return { isLoading: false, isPending: true, reason: "dev_override" }
  }

  if (forcePasswordChange) {
    return { isLoading: false, isPending: true, reason: "force_password_change" }
  }

  if (localCompleted) {
    return { isLoading: false, isPending: false, reason: "completed" }
  }

  if (features.onboardingStateApi) {
    // Marcador: cuando exista el flag del backend, resolver aquí a partir de él.
    return { isLoading: false, isPending: false, reason: "backend_flag" }
  }

  if (branchesQuery.isLoading) {
    return { isLoading: true, isPending: false, reason: "unknown" }
  }

  // Si la consulta falla (red caída, permisos), no bloqueamos al usuario:
  // es preferible dejarlo entrar al panel que encerrarlo en el wizard.
  if (branchesQuery.isError) {
    return { isLoading: false, isPending: false, reason: "unknown" }
  }

  if ((branchesQuery.data ?? 0) === 0) {
    return { isLoading: false, isPending: true, reason: "no_branches" }
  }

  return { isLoading: false, isPending: false, reason: "completed" }
}
