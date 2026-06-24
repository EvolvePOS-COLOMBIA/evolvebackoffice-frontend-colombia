import { Menu, MoonStar, SunMedium } from "lucide-react"
import { useState } from "react"

import { SidebarContent } from "@/components/layout/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useGetUsers } from "@/features/users/hooks/use-users"
import { useSoftwares } from "@/features/softwares/hooks/use-softwares"
import { useAllVersions } from "@/features/versions/hooks/use-versions"
import { useAppStore } from "@/store/app-store"
import { useLocation } from "react-router-dom"

export function Navbar() {
  const { isUserRole } = useAuth()
  const { data: softwareProducts } = useSoftwares()
  const { data: users } = useGetUsers(!isUserRole)
  const { data: releaseVersions } = useAllVersions()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const location = useLocation()

  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  const resolvedTheme =
    theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme

  return (
    <Card className="sticky top-0 z-20 rounded-none border-x-0 border-t-0 bg-background/82 shadow-none backdrop-blur-xl">
      <div className="flex min-h-22 flex-col justify-center gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mt-0.5 lg:hidden" aria-label="Open navigation menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 lg:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Access the main sections of Version Manager.</SheetDescription>
              </SheetHeader>
              <SidebarContent isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-primary/80 uppercase">Evolve Versions</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{getPageTitle(location.pathname)}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Badge tone="neutral">{softwareProducts?.length ?? 0} products</Badge>
          <Badge tone="neutral">{releaseVersions?.length ?? 0} versions</Badge>
          {!isUserRole && <Badge tone="neutral">{users?.length ?? 0} users</Badge>}
          <Button
            variant="outline"
            className="justify-start bg-background/55"
            onClick={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }}
          >
            {resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
            {resolvedTheme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  if (pathname.startsWith("/softwares")) return "Software Catalog"
  if (pathname.startsWith("/users")) return "User Manager"
  if (pathname.startsWith("/versions/new")) return "Version Builder"
  if (pathname.startsWith("/versions/")) return "Version Details"
  return "Global Version History"
}
