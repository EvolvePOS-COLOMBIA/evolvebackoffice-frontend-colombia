import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { UnauthorizedPage } from "@/features/auth/pages/unauthorized-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"
import { BusinessDashboardPage } from "@/features/business/dashboard/pages/business-dashboard-page"
import { InventoryPage } from "@/features/business/inventory/pages/inventory-page"
import { OnboardingPage } from "@/features/business/onboarding/pages/onboarding-page"
import { ItemsPage } from "@/features/business/items/pages/items-page"
import { ItemsCatalogPage } from "@/features/business/items/catalog/pages/items-catalog-page"
import { ItemFormPage } from "@/features/business/items/catalog/pages/item-form-page"
import { DepartmentsPage } from "@/features/business/items/departments/pages/departments-page"
import { TaxesPage } from "@/features/business/items/taxes/pages/taxes-page"
import { ModifiersPage } from "@/features/business/items/modifiers/pages/modifiers-page"
import { PeoplePage } from "@/features/business/people/pages/people-page"
import { UsersCatalogPage } from "@/features/business/people/users/pages/users-catalog-page"
import { CustomersPage } from "@/features/business/people/customers/pages/customers-page"
import { SuppliersPage } from "@/features/business/people/suppliers/pages/suppliers-page"
import { StockPage } from "@/features/business/inventory/stock/pages/stock-page"
import { PurchaseOrdersPage } from "@/features/business/inventory/purchase-orders/pages/purchase-orders-page"
import { TransfersPage } from "@/features/business/inventory/transfers/pages/transfers-page"
import { ProductionPage } from "@/features/business/inventory/production/pages/production-page"
import { SalesPage } from "@/features/business/inventory/sales/pages/sales-page"
import { ReportsPage } from "@/features/business/reports/pages/reports-page"
import { SettingsPage } from "@/features/business/settings/pages/settings-page"
import { PaymentMethodsPage } from "@/features/business/payment-methods/pages/payment-methods-page"
import { RegistersPage } from "@/features/business/registers/pages/registers-page"
import { OrdersPage } from "@/features/business/orders/pages/orders-page"
import { OrderClosingPage } from "@/features/business/orders/pages/order-closing-page"
import { DeliveryPage } from "@/features/business/delivery/pages/delivery-page"
import { BranchTerminalSettingsPage } from "@/features/business/branches/pages/branch-terminal-settings-page"
import { BranchConfigPage } from "@/features/business/branches/pages/branch-config-page"
import { BranchesPage } from "@/features/business/branches/pages/branches-page"
import { AiChatPage } from "@/features/business/ai-chat/pages/ai-chat-page"
import { MarketingPage } from "@/features/marketing/pages/marketing-page"
import { TenantsPage } from "@/features/platform/tenants/pages/tenants-page"
import { TenantDetailPage } from "@/features/platform/tenants/pages/tenant-detail-page"
import { TenantCreatePage } from "@/features/platform/tenants/pages/tenant-create-page"
import { PlatformDashboardPage } from "@/features/platform/dashboard/pages/platform-dashboard-page"
import { PlatformUsersPage } from "@/features/platform/users/pages/platform-users-page"
import { EmailSettingsPage } from "@/features/platform/email/pages/email-settings-page"
import { AiSettingsPage } from "@/features/platform/ai-settings/pages/ai-settings-page"
import { LogsPage } from "@/features/platform/logs/pages/logs-page"
import { AuditPage } from "@/features/platform/audit/pages/audit-page"
import { OnboardingGate } from "@/routes/onboarding-gate"
import { ProtectedRoute } from "@/routes/protected-route"
import { PublicRoute } from "@/routes/public-route"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSessionExpiry } from "@/features/auth/hooks/use-session-expiry"

function AppRoutesContent() {
  const { defaultRoute, isAuthenticated } = useAuth()

  useSessionExpiry()

  return (
    <Routes>
      <Route element={<PublicRoute redirectAuthenticated />}>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["PlatformAdmin", "PlatformSubAdmin", "PlatformSupervisor"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/platform/dashboard" element={<PlatformDashboardPage />} />
          <Route path="/platform/tenants" element={<TenantsPage />} />
          <Route path="/platform/tenants/create" element={<TenantCreatePage />} />
          <Route path="/platform/tenants/:id" element={<TenantDetailPage />} />
          <Route path="/platform/users" element={<PlatformUsersPage />} />
          <Route path="/platform/email-settings" element={<EmailSettingsPage />} />
          <Route path="/platform/ai-settings" element={<AiSettingsPage />} />
          <Route path="/platform/logs" element={<LogsPage />} />
          <Route path="/platform/audit" element={<AuditPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["BusinessAdmin"]} />}>
        {/* El onboarding vive fuera del AppLayout: pantalla completa, sin sidebar. */}
        <Route path="/business/onboarding" element={<OnboardingPage />} />

        <Route element={<OnboardingGate />}>
          <Route element={<AppLayout />}>
            <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
            <Route path="/business/orders" element={<OrdersPage />} />
            <Route path="/business/orders/closing" element={<OrderClosingPage />} />
            <Route path="/business/delivery" element={<DeliveryPage />} />
            <Route path="/business/items" element={<ItemsPage />} />
            <Route path="/business/items/catalog" element={<ItemsCatalogPage />} />
            <Route path="/business/items/catalog/new" element={<ItemFormPage />} />
            <Route path="/business/items/catalog/:itemId" element={<ItemFormPage />} />
            <Route path="/business/items/departments" element={<DepartmentsPage />} />
            <Route path="/business/items/taxes" element={<TaxesPage />} />
            <Route path="/business/items/modifiers" element={<ModifiersPage />} />
            <Route path="/business/inventory" element={<InventoryPage />} />
            <Route
              path="/business/inventory/suppliers"
              element={<Navigate to="/business/people/suppliers" replace />}
            />
            <Route path="/business/inventory/stock" element={<StockPage />} />
            <Route path="/business/inventory/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/business/inventory/transfers" element={<TransfersPage />} />
            <Route path="/business/inventory/production" element={<ProductionPage />} />
            <Route path="/business/inventory/sales" element={<SalesPage />} />
            <Route path="/business/people" element={<PeoplePage />} />
            <Route path="/business/people/users" element={<UsersCatalogPage />} />
            <Route path="/business/people/suppliers" element={<SuppliersPage />} />
            <Route path="/business/people/customers" element={<CustomersPage />} />
            <Route path="/business/reports" element={<ReportsPage />} />
            <Route path="/business/ai-chat" element={<AiChatPage />} />
            <Route path="/business/settings" element={<SettingsPage />} />
            <Route path="/business/settings/branches" element={<BranchesPage />} />
            <Route path="/business/settings/registers" element={<RegistersPage />} />
            <Route path="/business/settings/payment-methods" element={<PaymentMethodsPage />} />
            <Route path="/business/branches/:branchId/settings/terminals" element={<BranchTerminalSettingsPage />} />
            <Route path="/business/branches/:branchId/config" element={<BranchConfigPage />} />
          </Route>
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
