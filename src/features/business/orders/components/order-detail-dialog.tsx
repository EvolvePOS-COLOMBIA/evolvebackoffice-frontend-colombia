import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { ORDER_STATUS_CONFIG, ORDER_ORIGIN_LABEL_KEY } from "../types"
import type { OrderListItem } from "../types/api"
import { MapPin, Clock, CreditCard, FileText, SquarePen, Tag } from "lucide-react"

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem | null
  /** Abre el formulario de edición de detalles (notas/dirección/envío). */
  onEdit?: () => void
}

export function OrderDetailDialog({ open, onOpenChange, order, onEdit }: OrderDetailDialogProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()

  if (!order) return null

  const statusConfig = ORDER_STATUS_CONFIG[order.statusCode]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {t("order_number")} #{order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}
            </DialogTitle>
            <Badge tone={statusConfig?.color}>{statusConfig?.label ?? order.statusName}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">{t("total")}</p>
            <p className="text-3xl font-bold">{formatCurrency(order.total)}</p>
            <p className="mt-2 font-semibold">
              {order.paymentConfirmed ? t("phase2_paid") : t("phase2_collect", { amount: formatCurrency(order.total) })}
            </p>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("payment_method")}:</span>
              <span className="font-medium">{order.paymentMethod ?? "—"}</span>
            </div>

            {order.origin ? (
              <div className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("origin")}:</span>
                <span className="font-medium">
                  {ORDER_ORIGIN_LABEL_KEY[order.origin] ? t(ORDER_ORIGIN_LABEL_KEY[order.origin]) : order.origin}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("address")}:</span>
              <span className="font-medium">{order.shippingStreet ?? "—"}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("created_at")}:</span>
              <span className="font-medium">{new Date(order.externalCreatedAt).toLocaleString("es-CO")}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("status")}:</span>
              <span className="font-medium">{order.statusName}</span>
            </div>
          </div>

          <Separator />

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
            {!!order.tipAmount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("phase2_tip")}</span>
                <span>{formatCurrency(order.tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span>{order.discount > 0 ? `− ${formatCurrency(order.discount)}` : formatCurrency(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Editar detalles (notas, dirección, costo de envío) */}
          {onEdit ? (
            <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
              <SquarePen className="mr-2 size-4" />
              {t("edit_order")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
