import { useState } from "react"
import { Outlet } from "react-router-dom"

import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog"

export function AppLayout() {
  const { session } = useAuth()
  const [passwordChanged, setPasswordChanged] = useState(false)

  // Mostrar modal solo para BusinessAdmin cuando forcePasswordChange es true
  const mustChangePassword =
    session?.user.role === "BusinessAdmin" &&
    session?.forcePasswordChange === true &&
    !passwordChanged

  return (
    <div className="relative h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(41,161,255,0.18),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(41,161,255,0.22),_transparent_36%)]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 bg-[radial-gradient(circle,_rgba(41,161,255,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle,_rgba(41,161,255,0.16),_transparent_55%)]" />
      </div>

      <div className="relative flex h-full">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </div>
        </section>
      </div>

      <ChangePasswordDialog
        open={mustChangePassword}
        onPasswordChanged={() => setPasswordChanged(true)}
      />
    </div>
  )
}
