import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/use-i18n"
import { notify } from "@/hooks/use-notify"
import { useDeliveryAction } from "../hooks/use-delivery-operations"
import type { DeliveryOrder } from "../types/delivery"
import { getApiErrorMessage } from "../utils/order-helpers"

export function DeliveryIncidentActions({ order }: { order: DeliveryOrder }) {
  const { t } = useTranslation("business-orders")
  const action = useDeliveryAction()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("No contesta")
  const returned = !!order.deliveryFailureReason || order.cancelledWhileDispatched
  const submit = () =>
    action.mutate(
      { path: `orders/${order.id}/${returned ? "return" : "incident"}`, payload: returned ? undefined : { reason } },
      {
        onSuccess: () => setOpen(false),
        onError: (e) => notify.error(getApiErrorMessage(e, t("status_update_failed"))),
      }
    )
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t(returned ? "phase2_return" : "phase2_not_delivered")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(returned ? "phase2_return" : "phase2_not_delivered")}</DialogTitle>
            <DialogDescription>#{order.reference}</DialogDescription>
          </DialogHeader>
          {!returned && (
            <label>
              {t("phase2_reason")}
              <select
                aria-label={t("phase2_reason")}
                className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>No contesta</option>
                <option>Dirección errada</option>
                <option>Rechazado</option>
              </select>
            </label>
          )}
          <Button disabled={action.isPending} onClick={submit}>
            {t(returned ? "phase2_confirm_return" : "save")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
