import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

export function PublicRoute({ redirectAuthenticated = false }: { redirectAuthenticated?: boolean }) {
  const { defaultRoute, isAuthenticated } = useAuth()

  if (redirectAuthenticated && isAuthenticated) {
    return <Navigate to={defaultRoute} replace />
  }

  return <Outlet />
}
