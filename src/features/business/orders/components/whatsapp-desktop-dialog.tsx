import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import type { DeliveryOrder } from "../types/delivery"
import { whatsappDesktopUrl } from "../utils/whatsapp-desktop"

export function WhatsAppDesktopDialog({ order, courierName }: { order: DeliveryOrder; courierName?: string | null }) {
  const { t } = useTranslation("business-orders")
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(order.customerPhone ?? "")
  const [message, setMessage] = useState("")
  if (order.platformCode !== "POSCO" || order.status !== "Shipped") return null
  const href = whatsappDesktopUrl(phone, message)
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setPhone(order.customerPhone ?? "")
          setMessage(
            t("e_whatsapp_message", {
              name: order.customerName ?? "",
              reference: order.reference,
              courier: courierName ?? t("courier"),
            })
          )
          setOpen(true)
        }}
      >
        {t("e_notify_customer")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("e_whatsapp_desktop")}</DialogTitle>
            <DialogDescription>{t("e_whatsapp_manual")}</DialogDescription>
          </DialogHeader>
          <label className="space-y-1">
            {t("phone")}
            <Input aria-label={t("e_recipient")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="space-y-1">
            {t("e_message")}
            <Textarea
              aria-label={t("e_message")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
            />
          </label>
          {!href && <p role="alert">{t("e_phone_invalid")}</p>}
          {href && message.trim() && (
            <Button asChild>
              <a href={href}>{t("e_open_desktop")}</a>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">{t("e_whatsapp_not_sent")}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
