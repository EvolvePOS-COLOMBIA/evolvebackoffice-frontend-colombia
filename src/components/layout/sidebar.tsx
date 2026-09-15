import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Settings,
  Users,
  ChevronsUpDown,
  Sparkles,
  CreditCard,
  Bell,
} from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { useState } from "react"

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
} from "@/components/ui/alert-dialog"
import { Logo } from "@/components/icons/logo"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useNotify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const platformNavigationItems = [
  { to: "/platform/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/platform/tenants", labelKey: "tenants", icon: Building2 },
  { to: "/platform/users", labelKey: "users", icon: Users },
  { to: "/platform/email-settings", labelKey: "email_settings", icon: Mail },
]

const businessNavigationItems = [
  { to: "/business/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/business/items", labelKey: "items", icon: Package },
  { to: "/business/inventory", labelKey: "inventory", icon: Building2 },
  { to: "/business/people", labelKey: "people", icon: Users },
  { to: "/business/reports", labelKey: "reports", icon: BarChart3 },
  { to: "/business/settings", labelKey: "settings", icon: Settings },
]

interface SidebarProps {
  isCollapsed?: boolean
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-svh shrink-0 border-r border-border/70 bg-sidebar/90 transition-all duration-300 lg:block",
        isCollapsed ? "w-20" : "w-70"
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </aside>
  )
}

export function SidebarContent({
  isMobile = false,
  isCollapsed = false,
  onNavigate,
}: {
  isMobile?: boolean
  isCollapsed?: boolean
  onNavigate?: () => void
}) {
  const { defaultRoute, isPlatformAdmin } = useAuth()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const navigationItems = isPlatformAdmin ? platformNavigationItems : businessNavigationItems

  return (
    <div
      className={cn(
        "flex h-full flex-col py-3",
        isMobile ? "overflow-y-auto bg-sidebar/95 px-4" : isCollapsed ? "items-center px-2" : "px-4"
      )}
    >
      {/* Logo / Cabecera */}
      <Link
        to={defaultRoute}
        onClick={onNavigate}
        className={cn(
          "flex items-center overflow-hidden",
          isCollapsed && !isMobile ? "w-full justify-center px-2" : ""
        )}
      >
        {isCollapsed && !isMobile ? (
          <img src="/EvolvePosIcon.svg" alt="EvolvePOS Icon" className="size-9 object-contain" />
        ) : (
          <Logo className="w-50" />
        )}
      </Link>

      <Separator className="my-3 w-full" />

      {/* Menú de navegación */}
      <nav
        className={cn(
          "mt-1.5 flex flex-1 flex-col gap-0.5",
          isCollapsed && !isMobile ? "w-full items-center" : "w-full"
        )}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={
                isCollapsed && !isMobile
                  ? t(
                      item.labelKey as
                        | "dashboard"
                        | "tenants"
                        | "items"
                        | "inventory"
                        | "people"
                        | "reports"
                        | "settings"
                    )
                  : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-l-3 py-3 text-sm font-medium transition-colors duration-300",
                isCollapsed && !isMobile ? "h-12 w-12 justify-center px-0" : "px-4",
                isActive
                  ? "border-primary/20 border-l-primary bg-primary/5 text-sidebar-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              {(!isCollapsed || isMobile) && (
                <span className="truncate">
                  {t(
                    item.labelKey as
                      | "dashboard"
                      | "tenants"
                      | "items"
                      | "inventory"
                      | "people"
                      | "reports"
                      | "settings"
                      | "users"
                      | "email_settings"
                  )}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Componente Modular de Usuario */}
      <SidebarUserMenu isCollapsed={isCollapsed && !isMobile} />

      {/* Footer / Versión */}
      {(!isCollapsed || isMobile) && (
        <div className="mt-4 flex w-full justify-between gap-4 px-2 text-[9px] text-muted-foreground uppercase">
          <span>{t("backoffice_colombia")}</span>
          <span>{t("version")} 1.1.2.1</span>
        </div>
      )}
    </div>
  )
}

interface SidebarUserMenuProps {
  isCollapsed?: boolean
}

export function SidebarUserMenu({ isCollapsed = false }: SidebarUserMenuProps) {
  const { logout, session } = useAuth()
  const notify = useNotify()
  const { t } = useTranslation()
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false)

  const handleLogout = () => {
    logout()
    notify.info(t("session_closed"), { icon: <LogOut className="size-4 text-red-400" /> })
    setOpenLogoutDialog(false)
  }

  const fullName = session?.user.fullName ?? "—"
  const email = session?.user.email ?? "—"

  return (
    <>
      <div className={cn("mt-5 w-full", isCollapsed ? "flex justify-center" : "")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <button
                className="flex items-center justify-center rounded-xl p-1 transition-colors hover:bg-accent/70 focus:outline-none"
                title={fullName}
              >
                <ProfileAvatar name={fullName} size={8} />
              </button>
            ) : (
              <button className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/55 px-3 py-2 text-left transition-colors hover:bg-accent/70 focus:outline-none">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <ProfileAvatar name={fullName} size={8} />
                  <div className="overflow-hidden leading-tight">
                    <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <ProfileAvatar name={fullName} size={8} />
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium text-foreground">{fullName}</span>
                  <span className="truncate text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Sparkles className="mr-2 size-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 size-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 size-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
              onClick={() => setOpenLogoutDialog(true)}
            >
              <LogOut className="mr-2 size-4" />
              <span>{t("sign_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal de confirmación de salida */}
      <AlertDialog open={openLogoutDialog} onOpenChange={setOpenLogoutDialog}>
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
    </>
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
      className="flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary"
      style={{ width: `${size * 4.5}px`, height: `${size * 4.5}px` }}
      aria-hidden="true"
    >
      {initials || "PM"}
    </div>
  )
}
