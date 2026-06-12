import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { LoginPage } from "@/features/auth/pages/login-page"
import { SoftwareCatalogPage } from "@/features/softwares/pages/software-catalog-page"
import { UserManagerPage } from "@/features/users/pages/user-manager-page"
import { VersionDetailPage } from "@/features/versions/pages/version-detail-page"
import { VersionFormPage } from "@/features/versions/pages/version-form-page"
import { VersionsHistoryPage } from "@/features/versions/pages/versions-history-page"
import { useAppStore } from "@/store/app-store"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicRoute } from "@/routes/public-route"

function AppRoutesContent() {
  const session = useAppStore((state) => state.session)
  const logout = useAppStore((state) => state.logout)
  const isAuthenticated = Boolean(session)

  useEffect(() => {
    if (session && new Date(session.expiresAt).getTime() <= Date.now()) {
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
          <Route path="/" element={<Navigate to="/versions" replace />} />
          <Route path="/softwares" element={<SoftwareCatalogPage />} />
          <Route path="/users" element={<UserManagerPage />} />
          <Route path="/versions" element={<VersionsHistoryPage />} />
          <Route path="/versions/new" element={<VersionFormPage />} />
          <Route path="/versions/:versionId" element={<VersionDetailPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/versions" : "/login"} replace />}
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
