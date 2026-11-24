import { PhoneOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useUpdateWhatsAppSettings } from "../hooks/use-whatsapp"
import type { WhatsAppStatus } from "../types"

type WhatsAppCallSettingsCardProps = {
  status: WhatsAppStatus
}

/**
 * Rechazo automático de llamadas al número del negocio. Se guarda al cambiar el
 * interruptor; quien llama recibe un mensaje fijo (no se personaliza).
 */
export function WhatsAppCallSettingsCard({ status }: WhatsAppCallSettingsCardProps) {
  const { t } = useTranslation("business-whatsapp")
  const update = useUpdateWhatsAppSettings()

  const toggle = (rejectCalls: boolean) => {
    update.mutate(
      { rejectCalls },
      {
        onSuccess: () => notify.success(t("calls_saved")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhoneOff className="size-5" />
          {t("calls_title")}
        </CardTitle>
        <CardDescription>{t("calls_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/60 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="whatsapp-rechazar-llamadas">{t("reject_calls")}</Label>
            <p className="text-xs text-muted-foreground">{t("reject_calls_hint")}</p>
          </div>
          <Switch
            id="whatsapp-rechazar-llamadas"
            checked={update.isPending ? (update.variables?.rejectCalls ?? status.rejectCalls) : status.rejectCalls}
            onCheckedChange={toggle}
            disabled={update.isPending}
          />
        </div>
      </CardContent>
    </Card>
  )
}
