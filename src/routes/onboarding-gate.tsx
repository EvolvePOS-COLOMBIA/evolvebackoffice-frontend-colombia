import { Navigate, Outlet } from "react-router-dom"

import Spinner from "@/components/Spinner"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useOnboardingStatus } from "@/features/business/onboarding/hooks/use-onboarding-status"

/**
 * Intercepta las rutas del negocio: mientras el tenant tenga el onboarding
 * pendiente, no se entra al panel.
 *
 * Excepción: cuando forcePasswordChange es true, permitimos el acceso al
 * dashboard porque el modal de cambio de contraseña se encargará de pedir
 * el cambio antes de permitir continuar.
 *
 * Va por fuera de `ProtectedRoute` a propósito: esa guarda también la usa
 * platform y no debe saber nada de onboarding.
 */
export function OnboardingGate() {
  const { session } = useAuth()
  const status = useOnboardingStatus()

  // Si el usuario tiene forcePasswordChange, permitimos el acceso al dashboard
  // El modal de cambio de contraseña se encargará de bloquear hasta que cambie
  const forcePasswordChange = session?.forcePasswordChange === true

  if (status.isLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Spinner className="border-primary" />
      </div>
    )
  }

  if (status.isPending && !forcePasswordChange) {
    return <Navigate to="/business/onboarding" replace />
  }

  return <Outlet />
}
