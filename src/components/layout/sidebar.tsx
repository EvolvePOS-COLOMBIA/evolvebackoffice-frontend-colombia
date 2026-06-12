import { Link, NavLink, useLocation } from "react-router-dom"
import { Boxes, LayoutTemplate, LogOut, MoonStar, PlusCircle, RotateCcw, SunMedium, Users } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/env"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"

const navigationItems = [
  { to: "/versions", label: "Version History", icon: LayoutTemplate },
  { to: "/softwares", label: "Software Catalog", icon: Boxes },
  { to: "/versions/new", label: "Create Version", icon: PlusCircle },
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
  const { session, logout } = useAuth()
  const resetDemoData = useAppStore((state) => state.resetDemoData)
  const isMockMode = useAppStore((state) => state.isMockMode)
  const { theme, setTheme } = useTheme()

  const { pathname } = useLocation()

  const resolvedTheme =
    theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme

  return (
    <div className={cn("flex h-full flex-col px-5 py-5", isMobile && "overflow-y-auto bg-sidebar/95")}>
      <Link to="/versions" onClick={onNavigate} className="flex items-center gap-3 px-2">
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
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                pathname === item.to
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
            <p className="text-sm font-medium text-foreground">{session?.user.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isMockMode ? <Badge tone="warning">Mock API</Badge> : null}
            <Badge tone="neutral" className="max-w-full truncate">
              {appConfig.apiBaseUrl}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-2">
        <Button
          variant="outline"
          className="justify-start bg-background/55"
          onClick={() => {
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
            onNavigate?.()
          }}
        >
          {resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
          Toggle Theme
        </Button>
        <Button
          variant="outline"
          className="justify-start bg-background/55"
          onClick={() => {
            resetDemoData()
            onNavigate?.()
          }}
        >
          <RotateCcw className="size-4" />
          Reset Demo Data
        </Button>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => {
            logout()
            onNavigate?.()
          }}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
