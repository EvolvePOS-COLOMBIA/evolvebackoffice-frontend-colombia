import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog"
import { useNewOrderNotifications } from "@/features/business/orders/hooks/use-new-order-notifications"
import { AiChatWidget } from "@/features/business/ai-chat/components/ai-chat-widget"

export function AppLayout() {
  const { session } = useAuth()
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { pathname } = useLocation()

  // Modo maximizado (estilo Jira): lo controla la página activa y se
  // restablece automáticamente al navegar a otra ruta.
  const isMaximized = useAppStore((s) => s.isMaximized)
  const setIsMaximized = useAppStore((s) => s.setIsMaximized)

  useEffect(() => {
    setIsMaximized(false)
  }, [pathname, setIsMaximized])

  // Notificaciones en tiempo real de órdenes nuevas (solo sesiones de tenant:
  // la sesión de plataforma no tiene tenantId). Sonido + toast + escritorio.
  useNewOrderNotifications(Boolean(session?.tenantId))

  const mustChangePassword = session?.forcePasswordChange === true && !passwordChanged

  return (
    <div className="relative h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.18),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(41,161,255,0.22),transparent_36%)]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 bg-[radial-gradient(circle,rgba(41,161,255,0.12),transparent_55%)] dark:bg-[radial-gradient(circle,rgba(41,161,255,0.16),transparent_55%)]" />
      </div>

      <div className="relative flex h-full">
        {/* Sidebar: colapsa suavemente a ancho 0 en modo maximizado */}
        <Sidebar isCollapsed={isCollapsed} />

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* Navbar: colapsa suavemente a altura 0 (grid-rows 1fr → 0fr) */}
          <div
            className={cn(
              "grid overflow-hidden transition-all duration-300 ease-out",
              isMaximized ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            )}
          >
            <div className="overflow-hidden">
              <Navbar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div
              className={cn(
                // flex + min-h-full: el outlet ocupa exactamente el alto
                // disponible (sin alturas mágicas de 100vh en cada página) y,
                // si una página crece más, el contenedor hace scroll normal.
                "flex min-h-full w-full flex-col transition-all duration-300 ease-out",
                isMaximized ? "animate-in p-6 duration-300 fade-in-0 zoom-in-95" : "p-3 sm:p-4 lg:p-5"
              )}
            >
              <Outlet />
            </div>
          </div>
        </section>
      </div>

      <ChangePasswordDialog open={mustChangePassword} onPasswordChanged={() => setPasswordChanged(true)} />
      <AiChatWidget />
    </div>
  )
}
