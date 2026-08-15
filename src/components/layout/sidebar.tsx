import { BarChart3, Building2, LayoutDashboard, LogOut, Package, Settings, Users } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Logo } from "@/components/icons/logo"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useNotify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"

const platformNavigationItems = [
  { to: "/platform/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/platform/clients", labelKey: "clients", icon: Building2 },
]

const businessNavigationItems = [
  { to: "/business/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/business/items", labelKey: "items", icon: Package },
  { to: "/business/inventory", labelKey: "inventory", icon: Building2 },
  { to: "/business/people", labelKey: "people", icon: Users },
  { to: "/business/reports", labelKey: "reports", icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="hidden h-svh w-[280px] shrink-0 border-r border-border/70 bg-sidebar/90 lg:block">
      <SidebarContent />
    </aside>
  )
}

export function SidebarContent({ isMobile = false, onNavigate }: { isMobile?: boolean; onNavigate?: () => void }) {
  const { defaultRoute, isPlatformAdmin, logout, session } = useAuth()
  const { pathname } = useLocation()
  const notify = useNotify()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const navigationItems = isPlatformAdmin ? platformNavigationItems : businessNavigationItems

  const handleLogout = () => {
    logout()
    notify.info(t("session_closed"), { icon: <LogOut className="size-4 text-red-400" /> })
    setOpen(false)
  }

  return (
    <div className={cn("flex h-full flex-col px-5 py-5", isMobile && "overflow-y-auto bg-sidebar/95")}>
      <Link to={defaultRoute} onClick={onNavigate} className="flex items-center">
        <Logo className="w-[200px]" />
      </Link>

      <Separator className="my-3" />

      <nav className="mt-5 flex flex-1 flex-col gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-l-3 px-4 py-3 text-sm font-medium transition-colors duration-300",
                isActive
                  ? "border-primary/20 border-l-primary bg-primary/5 text-sidebar-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {t(item.labelKey as "dashboard" | "clients" | "items" | "inventory" | "people" | "reports" | "settings")}
            </NavLink>
          )
        })}
      </nav>

      <NavLink
        to="/business/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-l-3 px-4 py-3 text-sm font-medium transition-colors duration-300",
          pathname === "/business/settings"
            ? "border-primary/20 border-l-primary bg-primary/5 text-sidebar-foreground"
            : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-foreground"
        )}
      >
        <Settings
          className={cn("size-5", pathname === "/business/settings" ? "text-primary" : "text-muted-foreground")}
        />
        {t("settings")}
      </NavLink>

      <Card className="mt-5 bg-background/55">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ProfileAvatar name={session?.user.fullName ?? ""} />
              <div>
                <p className="text-sm font-medium text-foreground">{session?.user.fullName ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{session?.user.email ?? "—"}</p>
              </div>
            </div>
          </div>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <LogOut className="size-4" />
                {t("sign_out")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("sign_out")}</AlertDialogTitle>
                <AlertDialogDescription>{t("logout_confirmation")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex justify-between gap-2">
                <AlertDialogCancel className="flex-1">{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction className="flex-1" variant="destructive" onClick={handleLogout}>
                  {t("sign_out")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between gap-4 px-2 text-[9px] text-muted-foreground uppercase">
        <span>{t("backoffice_colombia")}</span>
        <span>{t("version")} 1.1.2.1</span>
      </div>
    </div>
  )
}

function ProfileAvatar({ name, size = 9 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("")

  return (
    <div
      className="flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary"
      style={{ width: `${size * 4.5}px`, height: `${size * 4.5}px` }}
      aria-hidden="true"
    >
      {initials || "PM"}
    </div>
  )
}
