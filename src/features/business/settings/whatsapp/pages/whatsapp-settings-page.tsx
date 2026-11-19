import { AlertTriangle, MessageCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BackLink } from "@/components/ui/back-link"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { useTenantModules } from "@/features/business/branches/hooks/use-branch-modules"
import { useTranslation } from "@/i18n/use-i18n"
import { WhatsAppCallSettingsCard } from "../components/whatsapp-call-settings-card"
import { WhatsAppConnectionCard } from "../components/whatsapp-connection-card"
import { WhatsAppTestCard } from "../components/whatsapp-test-card"
import { useWhatsAppStatus } from "../hooks/use-whatsapp"
import { WHATSAPP_MODULE_CODE, type WhatsAppConnectionStatus } from "../types"

const STATUS_TONE: Record<WhatsAppConnectionStatus, BadgeTone> = {
  Connected: "success",
  Connecting: "warning",
  NotConnected: "neutral",
}

/** Configuración → WhatsApp: el cliente escribe su número y escanea el QR. */
export function WhatsAppSettingsPage() {
  const { t } = useTranslation("business-whatsapp")
  const { data: tenantModules, isLoading: modulesLoading } = useTenantModules()
  const hasModule = (tenantModules ?? []).some((m) => m.moduleCode === WHATSAPP_MODULE_CODE && m.isEnabled)
  const { data: status, isLoading, isError, refetch } = useWhatsAppStatus(hasModule)

  const header = (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-4">
          <BackLink to="/business/settings">{t("back_to_settings")}</BackLink>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold text-balance text-foreground">
              <MessageCircle className="size-7 text-primary" />
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        {status ? (
          <Card className="max-h-min rounded-3xl">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {t("status")}
              </p>
              <Badge tone={STATUS_TONE[status.status]}>{t(`status_${status.status}`)}</Badge>
              {status.statusCheckFailed ? <p className="text-xs text-muted-foreground">{t("status_unknown")}</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  )

  if (modulesLoading || (hasModule && isLoading)) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">{t("loading")}</div>
      </div>
    )
  }

  if (!hasModule) {
    return (
      <div className="space-y-6">
        {header}
        <Alert variant="info">
          <AlertTriangle />
          <AlertTitle>{t("module_disabled_title")}</AlertTitle>
          <AlertDescription>{t("module_disabled_desc")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isError || !status) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          variant="inline"
          title={t("load_error")}
          action={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      {!status.configured ? (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>{t("not_configured_title")}</AlertTitle>
          <AlertDescription>{t("not_configured_desc")}</AlertDescription>
        </Alert>
      ) : null}

      <WhatsAppConnectionCard status={status} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WhatsAppCallSettingsCard status={status} />
        <WhatsAppTestCard connected={status.status === "Connected"} />
      </div>
    </div>
  )
}
