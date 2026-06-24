import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { LoginPage } from "@/features/auth/pages/login-page"
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { SoftwareCatalogPage } from "@/features/softwares/pages/software-catalog-page"
import { UserManagerPage } from "@/features/users/pages/user-manager-page"
import { VersionDetailPage } from "@/features/versions/pages/version-detail-page"
import { VersionFormPage } from "@/features/versions/pages/version-form-page"
import { VersionsHistoryPage } from "@/features/versions/pages/versions-history-page"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicRoute } from "@/routes/public-route"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"

function AppRoutesContent() {
  const { logout, isAuthenticated, session, isUserRole } = useAuth()

  useEffect(() => {
    if (session && new Date(session.expiresAtUtc).getTime() <= Date.now()) {
      notify.info("Your session has expired. Please sign in again.")
      logout()
    }
  }, [logout, session])

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={isUserRole ? "/versions" : "/dashboard"} replace />} />
          <Route path="/dashboard" element={isUserRole ? <Navigate to="/versions" replace /> : <DashboardPage />} />
          <Route path="/softwares" element={<SoftwareCatalogPage />} />
          <Route path="/users" element={isUserRole ? <Navigate to="/versions" replace /> : <UserManagerPage />} />
          <Route path="/versions" element={<VersionsHistoryPage />} />
          <Route
            path="/versions/new"
            element={isUserRole ? <Navigate to="/versions" replace /> : <VersionFormPage />}
          />
          <Route path="/versions/:versionId" element={<VersionDetailPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (isUserRole ? "/versions" : "/dashboard") : "/login"} replace />}
      />
    </Routes>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  )
}
