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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import type { DeliveryShiftDto } from "../types"

type ShiftMovementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "extra-base" = entrega de más base; "pickup" = recogida parcial. */
  kind: "extra-base" | "pickup"
  shift: DeliveryShiftDto | null
  onConfirm: (amount: number, notes: string | null) => void
  isPending?: boolean
}

/**
 * Registro de un movimiento de caja sobre un turno abierto: entrega de más base
 * (aumenta el dinero esperado en mano) o recogida parcial (lo reduce). Un mismo
 * formulario para ambos casos según `kind`.
 */
export function ShiftMovementDialog({
  open,
  onOpenChange,
  kind,
  shift,
  onConfirm,
  isPending = false,
}: ShiftMovementDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Cada apertura arranca el formulario limpio (ajuste durante el render, mismo
  // patrón que user-form-dialog, en vez de setState en un efecto).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setAmount("")
      setNotes("")
      setError(null)
    }
  }

  const handleConfirm = () => {
    const parsed = Number(amount.trim())
    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setError(t("movement_amount_invalid"))
      return
    }
    setError(null)
    onConfirm(parsed, notes.trim() ? notes.trim() : null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "extra-base" ? t("movement_extra_title") : t("movement_pickup_title")}
            {shift?.domiciliarioName ? ` · ${shift.domiciliarioName}` : ""}
          </DialogTitle>
          <DialogDescription>
            {kind === "extra-base" ? t("movement_extra_desc") : t("movement_pickup_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movement-amount">{t("movement_amount_label")}</Label>
            <Input
              id="movement-amount"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(e.target.value)}
            />
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-notes">{t("movement_notes_label")}</Label>
            <Textarea
              id="movement-notes"
              value={notes}
              maxLength={500}
              placeholder={t("movement_notes_placeholder")}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleConfirm}>
            {isPending
              ? tCommon("saving")
              : kind === "extra-base"
                ? t("movement_confirm_extra")
                : t("movement_confirm_pickup")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
