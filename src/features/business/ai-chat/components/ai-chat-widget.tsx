import { useState } from "react"
import { useLocation } from "react-router-dom"
import { Sparkles } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useTenantModules } from "@/features/business/branches/hooks/use-branch-modules"
import { useTranslation } from "@/i18n/use-i18n"
import { ChatPanel } from "./chat-panel"

/**
 * Widget flotante del asistente de IA (área business). Solo se muestra si el
 * tenant tiene el módulo "IA" habilitado y no está en la página dedicada del
 * chat (/business/ai-chat).
 */
export function AiChatWidget() {
  const { t } = useTranslation("business-ai-chat")
  const { isBusinessAdmin, isPlatformAdmin, session } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const hasTenantSession = Boolean(session?.tenantId)
  const { data: tenantModules, isLoading } = useTenantModules(isBusinessAdmin && hasTenantSession)

  if (!isBusinessAdmin || !hasTenantSession) return null
  if (isLoading) return null
  if (pathname === "/business/ai-chat") return null

  const hasAiLicense = isPlatformAdmin || (tenantModules ?? []).some((m) => m.moduleCode === "IA" && m.isEnabled)
  if (!hasAiLicense) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open_assistant")}
        title={t("open_assistant")}
        className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
      >
        <Sparkles className="size-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[min(96vw,460px)] p-0 data-[state=open]:slide-in-from-right sm:max-w-none"
        >
          <SheetHeader className="border-b border-border/70 pr-14 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {t("title")}
            </SheetTitle>
            <SheetDescription className="sr-only">{t("welcome_desc")}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <ChatPanel variant="sheet" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
