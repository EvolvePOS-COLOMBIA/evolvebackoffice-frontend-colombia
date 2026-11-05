import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { ORDER_STATUS_CONFIG, ORDER_ORIGIN_LABEL_KEY } from "../types"
import type { OrderListItem } from "../types/api"
import { MapPin, Clock, CreditCard, FileText, SquarePen, Tag, Ban } from "lucide-react"
import { useOrderDetail } from "../hooks/use-orders"
import { CancelOrderDialog } from "./cancel-order-dialog"

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem | null
  /** Abre el formulario de edición de detalles (notas/dirección/envío). */
  onEdit?: () => void
}

/**
 * Diálogo modal para visualizar el detalle completo de un pedido, su historial de estados,
 * productos, trazabilidad de entrega y datos de cancelación/merma si aplica.
 */
export function OrderDetailDialog({ open, onOpenChange, order, onEdit }: OrderDetailDialogProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const { data: detail } = useOrderDetail(open ? (order?.id ?? "") : "")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  if (!order) return null

  const current = { ...order, ...detail }
  const statusConfig = ORDER_STATUS_CONFIG[current.statusCode]
  const canCancel =
    current.statusCode !== "Delivered" && current.statusCode !== "Cancelled" && current.statusCode !== "Refunded"
  const canEdit = current.statusCode !== "Cancelled" && current.statusCode !== "Refunded"

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
          {/* Tarjeta de información de orden cancelada */}
          {current.statusCode === "Cancelled" && (
            <div className="space-y-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-destructive">
                  <Ban className="size-4" />
                  {t("cancellation_info_title")}
                </span>
                {current.cancellationType && (
                  <Badge tone={current.cancellationType === "Waste" ? "warning" : "info"}>
                    {current.cancellationType === "Waste"
                      ? t("cancellation_type_waste")
                      : t("cancellation_type_restocked")}
                  </Badge>
                )}
              </div>

              {((current.wasteCost != null && current.wasteCost > 0) ||
                (detail?.wasteCost != null && detail.wasteCost > 0)) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("cancellation_waste_cost")}:</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(detail?.wasteCost ?? current.wasteCost ?? 0)}
                  </span>
                </div>
              )}

              {detail?.cancellationReason && (
                <div className="space-y-1 text-xs">
                  <span className="text-muted-foreground">{t("cancellation_reason_display")}:</span>
                  <p className="rounded-lg bg-background/60 p-2 text-foreground italic">
                    "{detail.cancellationReason}"
                  </p>
                </div>
              )}

              {detail?.wastedBy && (
                <div className="flex items-center justify-between border-t border-destructive/10 pt-1 text-[11px] text-muted-foreground">
                  <span>{t("cancellation_wasted_by")}:</span>
                  <span className="font-medium text-foreground">{detail.wastedBy}</span>
                </div>
              )}
            </div>
          )}

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

          {/* Acciones de la orden (Editar detalles / Cancelar orden) */}
          {(onEdit && canEdit) || canCancel ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {onEdit && canEdit ? (
                <Button type="button" variant="outline" className="flex-1" onClick={onEdit}>
                  <SquarePen className="mr-2 size-4" />
                  {t("edit_order")}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  type="button"
                  variant="destructive"
                  className={onEdit && canEdit ? "flex-1" : "w-full"}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <Ban className="mr-2 size-4" />
                  {t("cancel_order")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        order={current}
        onSuccess={() => {
          setCancelDialogOpen(false)
          onOpenChange(false)
        }}
      />
    </Dialog>
  )
}
