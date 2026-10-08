import { useState } from "react"
import { Bike, UserPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { useCouriers } from "../hooks/use-couriers"

const NONE = "__NONE__"

type CourierPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sucursal del pedido: se listan sus domiciliarios + los que atienden todas. */
  branchId: string | null
  title: string
  description?: string
  confirmLabel: string
  /** Domiciliario preseleccionado (el ya asignado). */
  defaultCourierId?: string | null
  /** Permite elegir "Sin domiciliario" (quitar la asignación). */
  allowNone?: boolean
  isPending?: boolean
  onConfirm: (courierId: string | null) => void
}

/**
 * Selector de domiciliario para asignar un pedido o enviarlo (En camino).
 * Solo se monta mientras está abierto: cada apertura arranca con el
 * domiciliario por defecto sin sincronizar estado en un efecto.
 */
export function CourierPickerDialog(props: CourierPickerDialogProps) {
  return props.open ? <CourierPickerDialogInner key={props.defaultCourierId ?? "none"} {...props} /> : null
}

function CourierPickerDialogInner({
  open,
  onOpenChange,
  branchId,
  title,
  description,
  confirmLabel,
  defaultCourierId,
  allowNone = false,
  isPending = false,
  onConfirm,
}: CourierPickerDialogProps) {
  const { t } = useTranslation("business-orders")
  const navigate = useNavigate()
  const { data, isLoading } = useCouriers(branchId)
  const couriers = data?.data ?? []
  const [value, setValue] = useState<string>(defaultCourierId ?? (allowNone ? NONE : ""))

  const handleConfirm = () => {
    if (!value) return
    onConfirm(value === NONE ? null : value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bike className="size-5 text-primary" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : couriers.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-border/70 p-4 text-center">
            <p className="text-sm text-muted-foreground">{t("courier_none_available")}</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/business/orders/couriers")}>
              <UserPlus className="mr-2 size-4" />
              {t("couriers_manage")}
            </Button>
          </div>
        ) : (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder={t("courier_select")} />
            </SelectTrigger>
            <SelectContent>
              {allowNone && <SelectItem value={NONE}>{t("courier_unassigned")}</SelectItem>}
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!value || isPending || couriers.length === 0}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
