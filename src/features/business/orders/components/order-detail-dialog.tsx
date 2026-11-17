import { useState, type ReactNode } from "react"
import { Ban, Clock, CreditCard, MapPin, SquarePen, Tag, User, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useOrderDetail } from "../hooks/use-orders"
import { ORDER_ORIGIN_LABEL_KEY, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem } from "../types/api"
import { CancelOrderDialog } from "./cancel-order-dialog"

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem | null
  /** Abre el formulario de edición de detalles (notas/dirección/envío). */
  onEdit?: () => void
}

const PAYMENT_LABEL_KEY: Record<string, string> = {
  CASH: "pay_cash",
  CARD: "pay_card",
  TRANSFER: "pay_transfer",
  MIXED: "pay_mixed",
}

/** "TARJETA_CREDITO" → "Tarjeta credito": legible cuando el código no tiene traducción. */
function humanizeCode(code: string) {
  const text = code.replace(/_/g, " ").toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface InfoFieldProps {
  icon: ReactNode
  label: string
  children: ReactNode
  className?: string
}

function InfoField({ icon, label, children, className }: InfoFieldProps) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  tone?: "default" | "muted"
}

function SummaryRow({ label, value, tone = "default" }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={tone === "muted" ? "text-muted-foreground tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  )
}

/**
 * Diálogo modal con el detalle de un pedido: estado, datos de entrega y pago,
 * productos, totales y datos de cancelación/merma si aplica.
 * Encabezado y acciones quedan fijos; solo el cuerpo hace scroll.
 */
export function OrderDetailDialog({ open, onOpenChange, order, onEdit }: OrderDetailDialogProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()
  const { data: detail } = useOrderDetail(open ? (order?.id ?? "") : "")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  if (!order) return null

  const current = { ...order, ...detail }
  const statusConfig = ORDER_STATUS_CONFIG[current.statusCode]
  const canCancel =
    current.statusCode !== "Delivered" && current.statusCode !== "Cancelled" && current.statusCode !== "Refunded"
  const canEdit = current.statusCode !== "Cancelled" && current.statusCode !== "Refunded"
  const showActions = (onEdit && canEdit) || canCancel

  const paymentLabel = current.paymentMethod
    ? PAYMENT_LABEL_KEY[current.paymentMethod]
      ? t(PAYMENT_LABEL_KEY[current.paymentMethod])
      : humanizeCode(current.paymentMethod)
    : "—"
  const originLabel = current.origin
    ? ORDER_ORIGIN_LABEL_KEY[current.origin]
      ? t(ORDER_ORIGIN_LABEL_KEY[current.origin])
      : current.origin
    : null
  const wasteCost = current.wasteCost ?? 0
  const reference = order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[min(94vw,560px)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-5 pt-5 pr-16 pb-4 sm:px-6 sm:pr-18">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <DialogTitle className="text-lg sm:text-xl">
              {t("order_number")} #{reference}
            </DialogTitle>
            <Badge tone={statusConfig?.color} className="px-3 py-1.5 text-xs">
              <span aria-hidden className="mr-2 size-2 rounded-full bg-current" />
              {statusConfig ? t(statusConfig.labelKey) : current.statusName}
            </Badge>
          </div>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 text-xs leading-5">
            <span>{order.branchName}</span>
            <span aria-hidden>·</span>
            <time dateTime={order.externalCreatedAt}>{formatDateTime(order.externalCreatedAt)}</time>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          {/* Información de cancelación */}
          {current.statusCode === "Cancelled" && (
            <div className="space-y-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
              <div className="flex items-center justify-between gap-2">
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

              {wasteCost > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("cancellation_waste_cost")}:</span>
                  <span className="font-semibold text-destructive">{formatCurrency(wasteCost)}</span>
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

          {/* Datos de la orden */}
          <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            <InfoField icon={<CreditCard className="size-3.5" />} label={t("payment_method")}>
              {paymentLabel}
            </InfoField>
            {originLabel ? (
              <InfoField icon={<Tag className="size-3.5" />} label={t("origin")}>
                {originLabel}
              </InfoField>
            ) : null}
            {detail?.customerName ? (
              <InfoField icon={<User className="size-3.5" />} label={t("customer")}>
                {detail.customerName}
              </InfoField>
            ) : null}
            <InfoField icon={<Clock className="size-3.5" />} label={t("created_at")}>
              {formatDateTime(order.externalCreatedAt)}
            </InfoField>
            <InfoField icon={<MapPin className="size-3.5" />} label={t("address")} className="sm:col-span-2">
              {[order.shippingStreet, order.shippingCity].filter(Boolean).join(" · ") || "—"}
            </InfoField>
            {detail?.notes ? (
              <InfoField icon={<FileText className="size-3.5" />} label={t("order_notes")} className="sm:col-span-2">
                {detail.notes}
              </InfoField>
            ) : null}
          </dl>

          {/* Productos */}
          <section aria-label={t("order_items_title")} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("order_items_title")}</h3>
              {detail ? (
                <span className="text-xs text-muted-foreground">
                  {detail.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              ) : null}
            </div>
            {!detail ? (
              <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
                {t("order_items_loading")}
              </p>
            ) : detail.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
                {t("order_items_empty")}
              </p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/40">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-3.5 py-3">
                    <span className="mt-0.5 inline-flex min-w-9 justify-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
                      {`${item.quantity}×`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5 font-medium break-words">{item.name}</p>
                      {item.sku ? <p className="text-xs text-muted-foreground">{item.sku}</p> : null}
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Totales */}
          <dl className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
            <SummaryRow label={t("subtotal")} value={formatCurrency(order.subTotal)} tone="muted" />
            {order.shippingCost > 0 ? (
              <SummaryRow label={t("shipping_cost")} value={formatCurrency(order.shippingCost)} tone="muted" />
            ) : null}
            {order.discount > 0 ? (
              <SummaryRow label={t("discount")} value={`− ${formatCurrency(order.discount)}`} tone="muted" />
            ) : null}
            <div className="flex items-baseline justify-between gap-4 border-t border-border/60 pt-3">
              <dt className="font-semibold">{t("total")}</dt>
              <dd className="text-2xl font-bold tabular-nums">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </div>

        {showActions ? (
          <div className="flex flex-col gap-3 border-t border-border/60 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-6">
            {onEdit && canEdit ? (
              <Button type="button" variant="outline" size="lg" className="h-11 w-full sm:flex-1" onClick={onEdit}>
                <SquarePen className="mr-2 size-4" />
                {t("edit_order")}
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="h-11 w-full sm:flex-1"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="mr-2 size-4" />
                {t("cancel_order")}
              </Button>
            ) : null}
          </div>
        ) : null}
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
