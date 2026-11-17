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
import { formatCurrency } from "@/utils/format"
import type { DeliveryShiftDto } from "../types"

type CloseShiftDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: DeliveryShiftDto | null
  onConfirm: () => void
  isPending?: boolean
}

/**
 * Confirmación del cierre de turno. Muestra el dinero esperado en mano actual y
 * explica el cuadre que se generará. El resultado (cuadre) se muestra al cerrar
 * con `ShiftSettlementDialog`.
 */
export function CloseShiftDialog({ open, onOpenChange, shift, onConfirm, isPending = false }: CloseShiftDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("close_title")}
            {shift?.domiciliarioName ? ` · ${shift.domiciliarioName}` : ""}
          </DialogTitle>
          <DialogDescription>{t("close_desc")}</DialogDescription>
        </DialogHeader>

        {shift ? (
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {t("close_expected")}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{formatCurrency(shift.expectedCash)}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? tCommon("saving") : t("close_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ShiftSettlementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Turno ya cerrado (con el cuadre devuelto por el backend). */
  shift: DeliveryShiftDto | null
}

/**
 * Resultado del cuadre de cierre: dinero esperado en mano, lo que se deja al
 * domiciliario y el dinero a entregar a la empresa.
 */
export function ShiftSettlementDialog({ open, onOpenChange, shift }: ShiftSettlementDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cuadre_title")}</DialogTitle>
          <DialogDescription>{t("cuadre_note")}</DialogDescription>
        </DialogHeader>

        {shift ? (
          <div className="space-y-2">
            <SettlementRow label={t("cuadre_expected")} value={formatCurrency(shift.expectedCash)} />
            <SettlementRow label={t("cuadre_share")} value={formatCurrency(shift.deliveryShareTotal)} />
            <SettlementRow
              label={t("cuadre_to_company")}
              value={formatCurrency(shift.deliveryToCompany ?? 0)}
              highlight
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SettlementRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border/70 bg-background/45"
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
