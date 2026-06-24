import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"

export function PublicRoute() {
  const { isAuthenticated, isUserRole } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={isUserRole ? "/versions" : "/dashboard"} replace />
  }

  return <Outlet />
}
