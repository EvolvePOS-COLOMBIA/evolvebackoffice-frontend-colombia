import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/i18n/use-i18n"
import { ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem } from "../types/api"
import { MapPin, Clock, CreditCard, FileText } from "lucide-react"

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem | null
}

export function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
  const { t } = useTranslation("business-orders")

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
            <Badge variant={statusConfig?.color as "warning" | "info" | "purple" | "success"}>
              {statusConfig?.label ?? order.statusName}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">{t("total")}</p>
            <p className="text-3xl font-bold">${order.total.toFixed(2)}</p>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("payment_method")}:</span>
              <span className="font-medium">{order.paymentMethod ?? "—"}</span>
            </div>

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
              <span>${order.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
