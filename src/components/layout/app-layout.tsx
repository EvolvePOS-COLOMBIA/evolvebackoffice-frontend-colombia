import { useState } from "react"
import { Outlet } from "react-router-dom"

import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog"

export function AppLayout() {
  const { session } = useAuth()
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const mustChangePassword =
    session?.user.role === "BusinessAdmin" && session?.forcePasswordChange === true && !passwordChanged

  return (
    <div className="relative h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.18),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.22),transparent_36%)]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 bg-[radial-gradient(circle,rgba(41,161,255,0.12),transparent_55%)] dark:bg-[radial-gradient(circle,rgba(41,161,255,0.16),transparent_55%)]" />
      </div>

      <div className="relative flex h-full">
        {/* Pasamos el estado de colapsado al Sidebar */}
        <Sidebar isCollapsed={isCollapsed} />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Pasamos la función para alternar al Navbar */}
          <Navbar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="w-full p-3 sm:p-4 lg:p-5">
              <Outlet />
            </div>
          </div>
        </section>
      </div>

      <ChangePasswordDialog open={mustChangePassword} onPasswordChanged={() => setPasswordChanged(true)} />
    </div>
  )
}
