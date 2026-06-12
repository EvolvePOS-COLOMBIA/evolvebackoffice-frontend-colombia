import { useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { useState } from "react"

import { SidebarContent } from "@/components/layout/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAppStore } from "@/store/app-store"

export function Navbar() {
  const location = useLocation()
  const releaseVersions = useAppStore((state) => state.releaseVersions)
  const softwareProducts = useAppStore((state) => state.softwareProducts)
  const users = useAppStore((state) => state.users)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <Card className="sticky top-0 z-20 rounded-none border-x-0 border-t-0 bg-background/82 shadow-none backdrop-blur-xl">
      <div className="flex min-h-20 flex-col justify-center gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
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
          <Badge tone="primary" className="max-w-full shrink-0 truncate">
            {location.pathname}
          </Badge>
          <Badge tone="neutral">{softwareProducts.length} products</Badge>
          <Badge tone="neutral">{releaseVersions.length} versions</Badge>
          <Badge tone="neutral">{users.length} users</Badge>
        </div>
      </div>
    </Card>
  )
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/softwares")) {
    return "Software Catalog"
  }

  if (pathname.startsWith("/users")) {
    return "User Manager"
  }

  if (pathname.startsWith("/versions/new")) {
    return "Version Builder"
  }

  if (pathname.startsWith("/versions/")) {
    return "Version Details"
  }

  return "Global Version History"
}
