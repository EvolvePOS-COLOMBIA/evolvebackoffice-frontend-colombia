import { Menu, MoonStar, SunMedium } from "lucide-react"
import { useState } from "react"

import { SidebarContent } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAppStore } from "@/store/app-store"

export function Navbar() {
  const { availableTenants, currentTenant, isBusinessAdmin, setActiveTenant } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  const resolvedTheme =
    theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme

  return (
    <Card className="sticky top-0 z-20 rounded-none border-x-0 border-t-0 bg-sidebar shadow-none backdrop-blur-xl">
      <div className="flex justify-between gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mt-0.5 lg:hidden" aria-label="Open navigation menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 lg:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Access the main sections of POS Manager.</SheetDescription>
              </SheetHeader>
              <SidebarContent isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {isBusinessAdmin && (
            <div className="min-w-[220px]">
              <Select value={currentTenant?.id} onValueChange={setActiveTenant}>
                <SelectTrigger className="bg-background/55">
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
