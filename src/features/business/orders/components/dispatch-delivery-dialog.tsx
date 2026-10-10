import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useDeliveryOperations } from "../hooks/use-delivery-operations"
import type { DeliveryOrder } from "../types/delivery"

export function DispatchDeliveryDialog({
  order,
  defaultCourierId,
  pending,
  onClose,
  onSubmit,
}: {
  order: DeliveryOrder
  defaultCourierId: string | null
  pending: boolean
  onClose: () => void
  onSubmit: (courierId: string, tendered: number | null, promised: string | null) => void
}) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const { data } = useDeliveryOperations(order.branchId)
  const [courier, setCourier] = useState(defaultCourierId ?? "")
  const [tendered, setTendered] = useState(order.cashTenderedAmount?.toString() ?? "")
  const [promised, setPromised] = useState("")
  const amount = tendered ? Number(tendered) : null
  const invalid = amount !== null && (!Number.isFinite(amount) || amount < order.total)
  const selected = courier || data?.couriers.find((c) => c.onDuty)?.id || ""
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delivery_dispatch_title")}</DialogTitle>
          <DialogDescription>
            #{order.reference} · {formatCurrency(order.total)}
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-1 text-sm">
          {t("courier_select")}
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            aria-label={t("courier_select")}
            value={selected}
            onChange={(e) => setCourier(e.target.value)}
          >
            <option value="">{t("courier_select")}</option>
            {data?.couriers.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name} · {t(c.onDuty ? "phase2_on_duty" : "phase2_off_duty")} · {c.load} {t("phase2_load")}
              </option>
            ))}
          </select>
        </label>
        {order.paymentConfirmed ? (
          <p className="font-semibold text-emerald-600">{t("phase2_paid")}</p>
        ) : (
          <label className="space-y-1 text-sm">
            {t("phase2_tendered")}
            <Input
              aria-label={t("phase2_tendered")}
              type="number"
              min={order.total}
              step="0.01"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
            />
          </label>
        )}
        {invalid && (
          <p role="alert" className="text-sm text-red-600">
            {t("phase2_tendered_error")}
          </p>
        )}
        {!order.paymentConfirmed && (
          <p>
            {t("phase2_carry_change", { amount: formatCurrency(Math.max(0, (amount ?? order.total) - order.total)) })}
          </p>
        )}
        <label className="space-y-1 text-sm">
          {t("phase2_promised")}
          <Input
            aria-label={t("phase2_promised")}
            type="datetime-local"
            value={promised}
            onChange={(e) => setPromised(e.target.value)}
          />
        </label>
        <Button
          disabled={!selected || invalid || pending}
          onClick={() =>
            onSubmit(
              selected,
              order.paymentConfirmed ? null : amount,
              promised ? new Date(promised).toISOString() : null
            )
          }
        >
          {t("delivery_dispatch")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
