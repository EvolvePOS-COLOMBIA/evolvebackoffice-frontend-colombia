import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { UnauthorizedPage } from "@/features/auth/pages/unauthorized-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { BusinessDashboardPage } from "@/features/business/dashboard/pages/business-dashboard-page"
import { InventoryPage } from "@/features/business/inventory/pages/inventory-page"
import { ItemsPage } from "@/features/business/items/pages/items-page"
import { PeoplePage } from "@/features/business/people/pages/people-page"
import { SettingsPage } from "@/features/business/settings/pages/settings-page"
import { MarketingPage } from "@/features/marketing/pages/marketing-page"
import { ClientsPage } from "@/features/platform/clients/pages/clients-page"
import { PlatformDashboardPage } from "@/features/platform/dashboard/pages/platform-dashboard-page"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicRoute } from "@/routes/public-route"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"

function AppRoutesContent() {
  const { defaultRoute, isAuthenticated, logout, session } = useAuth()

  useEffect(() => {
    if (session && new Date(session.expiresAtUtc).getTime() <= Date.now()) {
      notify.info("Your session has expired. Please sign in again.")
      logout()
    }
  }, [logout, session])

  return (
    <Routes>
      <Route element={<PublicRoute redirectAuthenticated />}>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["PlatformAdmin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/platform/dashboard" element={<PlatformDashboardPage />} />
          <Route path="/platform/clients" element={<ClientsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["BusinessAdmin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
          <Route path="/business/items" element={<ItemsPage />} />
          <Route path="/business/inventory" element={<InventoryPage />} />
          <Route path="/business/people" element={<PeoplePage />} />
          <Route path="/business/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
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
