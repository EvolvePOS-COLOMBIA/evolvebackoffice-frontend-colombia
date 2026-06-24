import { Link, NavLink, useLocation } from "react-router-dom"
import { BarChart3, BookDown, Boxes, LayoutTemplate, LogOut, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useNotify } from "@/hooks/use-notify"

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/versions", label: "Version History", icon: LayoutTemplate },
  { to: "/softwares", label: "Software Catalog", icon: Boxes },
  { to: "/versions/new", label: "Create Version", icon: BookDown },
  { to: "/users", label: "User Manager", icon: Users },
]

export function Sidebar() {
  return (
    <aside className="hidden h-svh w-[292px] shrink-0 border-r border-border/70 bg-sidebar/90 lg:block">
      <SidebarContent />
    </aside>
  )
}

export function SidebarContent({ isMobile = false, onNavigate }: { isMobile?: boolean; onNavigate?: () => void }) {
  const { session, logout, isUserRole } = useAuth()

  const { pathname } = useLocation()
  const notify = useNotify()

  return (
    <div className={cn("flex h-full flex-col px-5 py-5", isMobile && "overflow-y-auto bg-sidebar/95")}>
      <Link to={isUserRole ? "/versions" : "/dashboard"} onClick={onNavigate} className="flex items-center gap-3 px-2">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <LayoutTemplate className="size-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-primary/80 uppercase">Control Center</p>
          <h1 className="text-lg font-semibold text-sidebar-foreground">Version Manager</h1>
        </div>
      </Link>

      <Separator className="my-5" />

      <nav className="flex flex-1 flex-col gap-2">
        {navigationItems
          .filter((item) => {
            // Rutas protegidas que los usuarios con 'isUserRole' NO deben ver
            const restrictedRoutes = ["/users", "/dashboard", "/versions/new"]

            if (restrictedRoutes.includes(item.to)) {
              return !isUserRole
            }
            return true
          })
          .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.to
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
            <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Active Session
            </p>
            <div className="flex items-center gap-2">
              <ProfileAvatar name={session?.user.fullName ?? session?.user.userName ?? ""} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {session?.user.fullName ?? session?.user.userName ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">{session?.user.email ?? "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-2">
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => {
            logout()
            notify.info("Session closed.", { icon: <LogOut className="size-4 text-red-400" /> })
          }}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

const ProfileAvatar = ({ name, size = 9 }: { name: string; size?: number }) => (
  <img
    className={`size-${size} cursor-pointer`}
    src={`https://ui-avatars.com/api/?name=${name}&rounded=true&bold=true&color=random&background=random`}
    alt={`${name} Avatar`}
  ></img>
)
