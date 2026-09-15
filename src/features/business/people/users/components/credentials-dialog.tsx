import { useState } from "react"
import { Copy, Check, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/use-i18n"
import type { UserResponseDto } from "../types"

type CredentialsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponseDto | null
  onGoToList: () => void
}

export function CredentialsDialog({ open, onOpenChange, user, onGoToList }: CredentialsDialogProps) {
  const { t } = useTranslation("business-users-catalog")
  const [confirmed, setConfirmed] = useState(false)

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-140" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("credentials_title")}</DialogTitle>
          <DialogDescription>{t("credentials_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <CredentialRow label={t("full_name")} value={user.fullName ?? "—"} />
          <CredentialRow label={t("username_pos")} value={user.username ?? "—"} highlight="red" />
          <CredentialRow label={t("pin_pos")} value={user.temporaryPin ?? "—"} highlight="red" />
          <CredentialRow label={t("web_password")} value={user.temporaryWebPassword ?? "—"} highlight="blue" />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{t("credentials_warning")}</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="size-4"
          />
          {t("credentials_confirm")}
        </label>

        <DialogFooter>
          <Button
            disabled={!confirmed}
            onClick={() => {
              setConfirmed(false)
              onGoToList()
            }}
          >
            {t("go_to_list")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CredentialRow({ label, value, highlight }: { label: string; value: string; highlight?: "red" | "blue" }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1">
        <span
          className={`font-mono text-sm font-medium ${
            highlight === "red" ? "text-destructive" : highlight === "blue" ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </Button>
      </div>
    </div>
  )
}
