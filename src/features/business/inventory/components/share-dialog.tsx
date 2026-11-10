import { useState } from "react"
import { Copy, MessageCircle, Printer, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { whatsappDesktopUrl } from "@/features/business/inventory/utils/whatsapp-desktop"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

type ShareDialogProps = {
  title: string
  text: string
  phone: string | null
}

/**
 * Botón "Compartir" de pedidos y envíos: el resumen ya escrito se puede ajustar
 * y mandar por WhatsApp, copiar o imprimir (también sirve para guardar en PDF).
 */
export function ShareButton({ title, text, phone }: ShareDialogProps) {
  const { t } = useTranslation("business-inventory")
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(text)
  const [recipient, setRecipient] = useState(phone ?? "")
  const href = whatsappDesktopUrl(recipient, message)

  const openDialog = () => {
    setMessage(text)
    setRecipient(phone ?? "")
    setOpen(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      notify.success(t("share_copied"))
    } catch {
      notify.error(t("share_copy_error"))
    }
  }

  const print = () => {
    const win = window.open("", "_blank", "width=720,height=900")
    if (!win) return
    const pre = win.document.createElement("pre")
    pre.textContent = message
    pre.style.cssText = "font: 14px/1.5 ui-monospace, monospace; white-space: pre-wrap; margin: 24px;"
    win.document.title = title
    win.document.body.appendChild(pre)
    win.focus()
    win.print()
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog}>
        <Share2 className="mr-2 size-4" />
        {t("share")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("share_title", { title })}</DialogTitle>
            <DialogDescription>{t("share_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="compartir-telefono">{t("share_phone")}</Label>
              <Input id="compartir-telefono" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compartir-mensaje">{t("share_message")}</Label>
              <Textarea
                id="compartir-mensaje"
                rows={10}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={copy}>
                <Copy className="mr-2 size-4" />
                {t("share_copy")}
              </Button>
              <Button type="button" variant="outline" onClick={print}>
                <Printer className="mr-2 size-4" />
                {t("share_print")}
              </Button>
              {href ? (
                <Button asChild>
                  <a href={href}>
                    <MessageCircle className="mr-2 size-4" />
                    {t("share_whatsapp")}
                  </a>
                </Button>
              ) : (
                <Button type="button" disabled>
                  <MessageCircle className="mr-2 size-4" />
                  {t("share_whatsapp")}
                </Button>
              )}
            </div>
            {!href ? <p className="text-xs text-muted-foreground">{t("share_phone_hint")}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
