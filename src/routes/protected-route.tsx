import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/features/auth/hooks/use-auth"
import type { AppRole } from "@/features/auth/types"

export function ProtectedRoute({ allowedRoles }: { allowedRoles: AppRole[] }) {
  const { hasRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
