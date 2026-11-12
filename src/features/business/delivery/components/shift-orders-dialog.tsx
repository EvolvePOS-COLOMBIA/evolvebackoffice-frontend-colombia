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
import { useOrders } from "@/features/business/orders/hooks/use-orders"
import type { OrderListItem } from "@/features/business/orders/types/api"
import { useShiftDetail } from "../hooks/use-delivery"
import type { DeliveryShiftDto } from "../types"

type ShiftOrdersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string | null
  /** Turno del que se consultan los pedidos (para marcar los vinculados). */
  shift: DeliveryShiftDto | null
  /** Abre el formulario de entrega del pedido seleccionado. */
  onDeliver: (order: OrderListItem) => void
}

/**
 * Pedidos «En camino» de la sucursal con acceso al registro de entrega.
 *
 * Nota de contrato: el backend no expone el domiciliario/turno de cada pedido
 * (solo los `orderId` de los movimientos del turno), por lo que la lista son los
 * pedidos en camino de la sucursal —con DOMICILIOS habilitado todos tienen
 * domiciliario asignado— y se marca con «Este turno» los que ya registran
 * movimientos en el libro de efectivo del turno consultado.
 */
export function ShiftOrdersDialog({ open, onOpenChange, branchId, shift, onDeliver }: ShiftOrdersDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const { data: ordersData, isLoading } = useOrders(1, 100, { branchId: branchId ?? "", status: "Shipped" }, open)
  const { data: shiftDetail } = useShiftDetail(open && shift ? shift.id : null)

  const linkedOrderIds = useMemo(
    () => new Set((shiftDetail?.movements ?? []).map((m) => m.orderId).filter(Boolean) as string[]),
    [shiftDetail]
  )

  const orders = ordersData?.data ?? []

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
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("orders_empty")}</p>
          ) : (
            orders.map((order) => {
              const linked = linkedOrderIds.has(order.id)
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/45 px-4 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bike className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}
                      </span>
                      <Badge tone="neutral" className="text-[10px]">
                        {order.paymentMethod ?? "—"}
                      </Badge>
                      {linked ? (
                        <Badge tone="info" className="text-[10px]">
                          {t("orders_linked")}
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
                    <Button size="sm" variant="outline" onClick={() => onDeliver(order)}>
                      {t("deliver")}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {orders.length > 0 ? <p className="text-xs text-muted-foreground">{t("orders_linked_hint")}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
