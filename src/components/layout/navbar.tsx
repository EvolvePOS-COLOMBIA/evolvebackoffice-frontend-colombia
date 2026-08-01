import { Globe, Menu, MoonStar, SunMedium } from "lucide-react"
import { useState } from "react"

import { SidebarContent } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAppStore } from "@/store/app-store"
import i18n from "@/i18n"
import { useTranslation } from "@/i18n/use-i18n"

export function Navbar() {
  const { availableTenants, currentTenant, isBusinessAdmin, setActiveTenant } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)

  const resolvedTheme =
    theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme

  const handleLocaleChange = (value: string) => {
    const newLocale = value as "es" | "en"
    setLocale(newLocale)
    i18n.changeLanguage(newLocale)
  }

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
                <SheetTitle>{t("navigation")}</SheetTitle>
                <SheetDescription>{t("backoffice_colombia")}</SheetDescription>
              </SheetHeader>
              <SidebarContent isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {isBusinessAdmin && (
            <div className="min-w-[220px]">
              <Select value={currentTenant?.id} onValueChange={setActiveTenant}>
                <SelectTrigger className="bg-background/55">
                  <SelectValue placeholder={t("select_business")} />
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
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="w-max bg-background/55">
              <Globe className="mr-1 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="justify-start bg-background/55"
            onClick={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }}
          >
            {resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
            {resolvedTheme === "dark" ? t("light") : t("dark")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
