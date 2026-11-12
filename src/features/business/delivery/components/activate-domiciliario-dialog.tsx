import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/i18n/use-i18n"
import type { DeliveryDomiciliarioDto } from "../types"

type ActivateDomiciliarioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  domiciliario: DeliveryDomiciliarioDto | null
  /** Base configurada en la sucursal (precarga; vacía si no hay base). */
  defaultBase: number | null
  onConfirm: (baseAmount: number | null) => void
  isPending?: boolean
}

/**
 * Activación de un domiciliario = apertura de su turno con la base a entregar.
 * La base se precarga con la configurada en la sucursal y es editable antes de
 * confirmar; es obligatoria cuando la sucursal no tiene base configurada
 * (misma regla que valida el backend).
 */
export function ActivateDomiciliarioDialog({
  open,
  onOpenChange,
  domiciliario,
  defaultBase,
  onConfirm,
  isPending = false,
}: ActivateDomiciliarioDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const [base, setBase] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Cada apertura precarga la base configurada (ajuste durante el render, mismo
  // patrón que user-form-dialog, en vez de setState en un efecto).
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevDefaultBase, setPrevDefaultBase] = useState(defaultBase)
  if (open !== prevOpen || defaultBase !== prevDefaultBase) {
    setPrevOpen(open)
    setPrevDefaultBase(defaultBase)
    if (open) {
      setBase(defaultBase != null ? String(defaultBase) : "")
      setError(null)
    }
  }

  const handleConfirm = () => {
    const trimmed = base.trim()
    const parsed = trimmed === "" ? null : Number(trimmed)
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) {
      setError(t("activate_base_nonneg"))
      return
    }
    if (parsed == null && defaultBase == null) {
      setError(t("activate_base_required"))
      return
    }
    setError(null)
    onConfirm(parsed ?? defaultBase)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("activate_title")}
            {domiciliario ? ` · ${domiciliario.fullName}` : ""}
          </DialogTitle>
          <DialogDescription>{t("activate_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="activate-base">{t("activate_base_label")}</Label>
          <Input
            id="activate-base"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={base}
            placeholder={defaultBase != null ? String(defaultBase) : "0"}
            onChange={(e) => setBase(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("activate_base_hint")}</p>
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleConfirm}>
            {isPending ? tCommon("saving") : t("activate_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
