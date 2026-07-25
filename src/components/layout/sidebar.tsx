import { Building2, LayoutDashboard, LogOut, Package, Settings, ShieldCheck, Users } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useNotify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"

const platformNavigationItems = [
  { to: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/platform/clients", label: "Clients", icon: Building2 },
]

const businessNavigationItems = [
  { to: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business/items", label: "Items", icon: Package },
  { to: "/business/inventory", label: "Inventory", icon: Building2 },
  { to: "/business/people", label: "People", icon: Users },
  { to: "/business/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden h-svh w-[292px] shrink-0 border-r border-border/70 bg-sidebar/90 lg:block">
      <SidebarContent />
    </aside>
  )
}

export function SidebarContent({ isMobile = false, onNavigate }: { isMobile?: boolean; onNavigate?: () => void }) {
  const { currentTenant, defaultRoute, isBusinessAdmin, isPlatformAdmin, logout, session } = useAuth()
  const { pathname } = useLocation()
  const notify = useNotify()
  const navigationItems = isPlatformAdmin ? platformNavigationItems : businessNavigationItems

  return (
    <div className={cn("flex h-full flex-col px-5 py-5", isMobile && "overflow-y-auto bg-sidebar/95")}>
      <Link to={defaultRoute} onClick={onNavigate} className="flex items-center gap-3 px-2">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-primary/80 uppercase">Control Center</p>
          <h1 className="text-lg font-semibold text-sidebar-foreground">POS Manager</h1>
        </div>
      </Link>

      <Separator className="my-5" />

      <nav className="flex flex-1 flex-col gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary/20 bg-primary/10 text-sidebar-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <Card className="mt-5 rounded-[26px] bg-background/55">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="space-y-1">
            {/* <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Active Session
            </p> */}
            <div className="flex items-center gap-2">
              <ProfileAvatar name={session?.user.fullName ?? ""} />
              <div>
                <p className="text-sm font-medium text-foreground">{session?.user.fullName ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{session?.user.email ?? "—"}</p>
              </div>
            </div>
            {/* <div className="flex flex-wrap gap-2 pt-2">
              <Badge tone={isPlatformAdmin ? "purple" : "info"}>{session?.user.role ?? "Unknown"}</Badge>
              {isBusinessAdmin && currentTenant ? <Badge tone="neutral">{currentTenant.businessName}</Badge> : null}
            </div> */}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              logout()
              notify.info("Session closed.", { icon: <LogOut className="size-4 text-red-400" /> })
            }}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-2"></div>
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
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      aria-hidden="true"
    >
      {initials || "PM"}
    </div>
  )
}
