import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { DeliveryOrder } from "../types/delivery"
import { whatsappDesktopUrl } from "../utils/whatsapp-desktop"

export type ContactOrder = Pick<DeliveryOrder, "reference" | "status" | "customerName" | "customerPhone"> &
  Partial<Pick<DeliveryOrder, "total" | "shippingStreet" | "shippingCity" | "paymentConfirmed" | "isReconciled">>

export function WhatsAppDesktopDialog({
  order,
  courierName,
  courierPhone,
  recipient = "customer",
}: {
  order: ContactOrder
  courierName?: string | null
  courierPhone?: string | null
  recipient?: "customer" | "courier"
}) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(order.customerPhone ?? "")
  const [message, setMessage] = useState("")
  if (recipient === "courier" && (!courierPhone || !["Ready", "Shipped", "Cancelled"].includes(order.status)))
    return null
  const href = whatsappDesktopUrl(phone, message)
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setPhone((recipient === "courier" ? courierPhone : order.customerPhone) ?? "")
          const messageKey =
            recipient === "courier"
              ? order.status === "Cancelled"
                ? "e_whatsapp_courier_cancelled_message"
                : "e_whatsapp_courier_message"
              : order.status === "Shipped"
                ? "e_whatsapp_message"
                : order.status === "Ready"
                  ? "e_whatsapp_ready_message"
                  : order.status === "Delivered"
                    ? "e_whatsapp_delivered_message"
                    : order.status === "Cancelled" || order.status === "Refunded"
                      ? "e_whatsapp_cancelled_message"
                      : "e_whatsapp_status_message"
          setMessage(
            t(messageKey, {
              name: order.customerName?.trim() || t("customer"),
              reference: order.reference,
              courier: courierName ?? t("courier"),
              address: [order.shippingStreet, order.shippingCity].filter(Boolean).join(", ") || "—",
              phone: order.customerPhone ?? "—",
              collection:
                order.paymentConfirmed || order.isReconciled
                  ? t("phase2_paid")
                  : t("phase2_collect", { amount: formatCurrency(order.total ?? 0) }),
            })
          )
          setOpen(true)
        }}
      >
        {t(recipient === "courier" ? "e_notify_courier" : "e_notify_customer")}
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
