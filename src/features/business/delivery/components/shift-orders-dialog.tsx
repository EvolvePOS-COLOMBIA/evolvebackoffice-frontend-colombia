import { useMemo } from "react"
import { Bike, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/use-i18n"
import { formatCurrency } from "@/utils/format"
import { useShiftOrders } from "../hooks/use-delivery"
import type { DeliverableOrder, DeliveryShiftDto } from "../types"
import { pendingDeliveries } from "../utils/shift-orders"

type ShiftOrdersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Turno del domiciliario cuyos pedidos en camino se listan. */
  shift: DeliveryShiftDto | null
  /** Abre el formulario de entrega del pedido seleccionado. */
  onDeliver: (order: DeliverableOrder) => void
}

/**
 * Pedidos «En camino» asignados al turno del domiciliario
 * (`GET /api/delivery/shifts/{id}/orders`), con acceso al registro de entrega.
 */
export function ShiftOrdersDialog({ open, onOpenChange, shift, onDeliver }: ShiftOrdersDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const { data, isLoading, isError, refetch } = useShiftOrders(open && shift ? shift.id : null)

  const orders = useMemo(() => pendingDeliveries(data ?? []), [data])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("orders_title")}
            {shift?.domiciliarioName ? ` · ${shift.domiciliarioName}` : ""}
          </DialogTitle>
          <DialogDescription>{t("orders_desc")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
              <p>{t("orders_error")}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                {t("orders_retry")}
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("orders_empty")}</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.orderId}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/45 px-4 py-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bike className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.externalOrderId?.slice(0, 8) || order.orderId.slice(0, 8)}
                    </span>
                    <Badge tone="neutral" className="text-[10px]">
                      {order.paymentMethod ?? "—"}
                    </Badge>
                    {order.hasAdvance ? (
                      <Badge tone="info" className="text-[10px]">
                        {t("orders_advance", { amount: formatCurrency(order.advanceAmount) })}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    {order.shippingStreet ?? order.shippingCity ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onDeliver({ id: order.orderId, externalOrderId: order.externalOrderId, total: order.total })
                    }
                  >
                    {t("deliver")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
