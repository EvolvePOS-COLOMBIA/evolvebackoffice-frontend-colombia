import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useSendWhatsAppTest } from "../hooks/use-whatsapp"
import { isValidWhatsAppNumber, phoneDigits } from "../utils/phone"

type WhatsAppTestCardProps = {
  connected: boolean
}

/** Mensaje de prueba desde el WhatsApp del negocio a un número cualquiera. */
export function WhatsAppTestCard({ connected }: WhatsAppTestCardProps) {
  const { t } = useTranslation("business-whatsapp")
  const sendTest = useSendWhatsAppTest()
  const [phone, setPhone] = useState("")
  const valid = isValidWhatsAppNumber(phone)

  const send = () => {
    if (!valid || sendTest.isPending) return
    sendTest.mutate(phoneDigits(phone), {
      onSuccess: () => notify.success(t("test_sent")),
      onError: (error) => notify.error(getApiErrorMessage(error, t("test_error"))),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-5" />
          {t("test_title")}
        </CardTitle>
        <CardDescription>{t("test_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="whatsapp-prueba">{t("test_phone_label")}</Label>
            <Input
              id="whatsapp-prueba"
              type="tel"
              inputMode="tel"
              maxLength={25}
              placeholder="+57 300 123 4567"
              value={phone}
              disabled={!connected}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!connected || !valid || sendTest.isPending}>
            <Send className="size-4" />
            {sendTest.isPending ? t("sending") : t("send_test")}
          </Button>
          {!connected ? <p className="text-sm text-muted-foreground">{t("test_connect_first")}</p> : null}
        </form>
      </CardContent>
    </Card>
  )
}
