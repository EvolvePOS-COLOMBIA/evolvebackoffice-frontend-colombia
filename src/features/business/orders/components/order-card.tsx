import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { enUS, es } from "date-fns/locale"
import { AlertTriangle, Ban, ChevronDown, Clock, Eye, MapPin, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useOrderDetail } from "../hooks/use-orders"
import { ORDER_ORIGIN_LABEL_KEY } from "../types"
import type { OrderListItem } from "../types/api"

/** i18n key for each canonical paymentMethod value (SelectItem in manual-order-dialog). */
const PAYMENT_LABEL_KEY: Record<string, string> = {
  CASH: "pay_cash",
  CARD: "pay_card",
  TRANSFER: "pay_transfer",
  MIXED: "pay_mixed",
}

/** Statuses still in flight when the 30-minute SLA breach applies. */
const SLA_BREACH_STATUSES: string[] = ["Pending", "Confirmed", "Preparing"]
const SLA_BREACH_MS = 30 * 60 * 1000

interface OrderCardProps {
  order: OrderListItem
  /** In "all branches" view the card shows its own branch. */
  showBranch: boolean
  /** Prefetches the detail for the first cards of the column (index < 8). */
  priority?: boolean
  onViewDetail: (order: OrderListItem) => void
  onCancelOrder?: (order: OrderListItem) => void
}

/**
 * Kanban order card body (rich + expandible): reference and age, customer,
 * total and payment method, items, address, origin and an expandable panel
 * with the full order detail.
 *
 * The container (ref/drag props, styles and the `group` class) stays in
 * `OrdersKanban`; this component only renders the content and owns the
 * hover/expand state that lazily enables the detail fetch.
 */
export function OrderCard({ order, showBranch, priority = false, onViewDetail, onCancelOrder }: OrderCardProps) {
  const { t, i18n } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()

  const [expanded, setExpanded] = useState(false)
  // After the first hover the detail stays cached; never reset.
  const [hovered, setHovered] = useState(false)

  const { data: detail, isLoading, isError } = useOrderDetail(order.id, priority || hovered || expanded)

  const createdAt = new Date(order.externalCreatedAt)
  // The SLA indicator depends on the wall clock: recomputed on every render
  // on purpose (live ops board).
  const slaBreached =
    // eslint-disable-next-line react-hooks/purity -- current time; the SLA badge must update on re-render
    Date.now() - createdAt.getTime() > SLA_BREACH_MS && SLA_BREACH_STATUSES.includes(order.statusCode)
  const dateLocale = i18n.language.startsWith("es") ? es : enUS

  const reference = order.externalOrderId ?? order.id
  const shortReference = order.externalOrderId?.slice(0, 12) ?? order.id.slice(0, 8)

  const originLabel = order.origin
    ? ORDER_ORIGIN_LABEL_KEY[order.origin]
      ? t(ORDER_ORIGIN_LABEL_KEY[order.origin])
      : order.origin
    : null

  const paymentLabel = order.paymentMethod
    ? PAYMENT_LABEL_KEY[order.paymentMethod]
      ? t(PAYMENT_LABEL_KEY[order.paymentMethod])
      : order.paymentMethod
    : null

  // Non-zero money breakdown for the total tooltip (Subtotal / Shipping / Discount).
  const breakdown: string[] = []
  if (order.subTotal > 0) breakdown.push(`${t("subtotal")}: ${formatCurrency(order.subTotal)}`)
  if (order.shippingCost > 0) breakdown.push(`${t("shipping_cost")}: ${formatCurrency(order.shippingCost)}`)
  if (order.discount > 0) breakdown.push(`${t("discount")}: ${formatCurrency(order.discount)}`)

  const items = detail?.items ?? []
  const customerName = detail?.customerName ?? detail?.personName ?? null
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const visibleLines = items.slice(0, 2).map((item) => `${item.quantity} × ${item.nameSnapshot}`)
  const remainingLines = items.length - 2
  const itemsSummary = `${t("items_count", { count: totalUnits })} · ${visibleLines.join(", ")}${
    remainingLines > 0 ? ` ${t("more_items", { count: remainingLines })}` : ""
  }`

  return (
    <div onMouseEnter={() => setHovered(true)}>
      {/* Reference + relative age (SLA highlight) */}
      <div className="mb-2 flex items-start justify-between gap-1">
        <span className="min-w-0 truncate font-mono text-xs text-muted-foreground" title={reference}>
          #{shortReference}
        </span>
        <time
          title={formatDateTime(order.externalCreatedAt)}
          className={`flex shrink-0 items-center gap-1 text-[11px] ${
            slaBreached ? "text-amber-500" : "text-muted-foreground"
          }`}
        >
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(createdAt, { addSuffix: true, locale: dateLocale })}
        </time>
      </div>

      {/* Customer (hero, once the detail loads) + always-visible branch/platform badges */}
      <div className="mb-1 flex items-center gap-1">
        {customerName && <span className="min-w-0 truncate text-sm font-medium">{customerName}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {showBranch && order.branchName && (
            <Badge tone="info" className="max-w-28 truncate text-[10px] tracking-normal normal-case">
              {order.branchName}
            </Badge>
          )}
          <Badge tone="neutral" className="text-[10px]">
            {order.platformCode}
          </Badge>
        </span>
      </div>

      {/* Total + payment chip */}
      <div className="mb-1 flex items-center justify-between gap-1">
        <span
          className="text-base font-semibold tabular-nums"
          title={breakdown.length > 0 ? breakdown.join("\n") : undefined}
        >
          {formatCurrency(order.total)}
        </span>
        {paymentLabel && (
          <span className="shrink-0 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            {paymentLabel}
          </span>
        )}
      </div>

      {/* Cancelled extras (type + waste cost) */}
      {order.statusCode === "Cancelled" && (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {order.cancellationType && (
            <Badge tone={order.cancellationType === "Waste" ? "warning" : "info"} className="px-1.5 py-0 text-[10px]">
              {order.cancellationType === "Waste" ? t("cancellation_type_waste") : t("cancellation_type_restocked")}
            </Badge>
          )}
          {order.wasteCost != null && order.wasteCost > 0 && (
            <span className="font-mono text-[10px] font-medium text-destructive">-${order.wasteCost.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Item summary — requires the detail payload */}
      {detail && items.length > 0 && (
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <ShoppingCart className="h-3 w-3 shrink-0" />
          <span className="truncate">{itemsSummary}</span>
        </div>
      )}

      {/* Address */}
      {order.shippingStreet && (
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {order.shippingStreet}
            {order.shippingCity ? ` · ${order.shippingCity}` : ""}
          </span>
        </div>
      )}

      {/* Origin + actions (revealed on card hover/focus) */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          {order.origin && (
            <>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="truncate">{originLabel}</span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {order.statusCode !== "Delivered" && order.statusCode !== "Cancelled" && onCancelOrder && (
            <Button
              aria-label={t("cancel_order")}
              title={t("cancel_order")}
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onCancelOrder(order)
              }}
            >
              <Ban className="h-3 w-3" />
            </Button>
          )}
          <Button
            aria-label={t("view_details")}
            title={t("view_details")}
            variant="ghost"
            size="sm"
            className="h-6 px-1.5"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetail(order)
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            aria-expanded={expanded}
            aria-label={expanded ? t("collapse_order") : t("expand_order")}
            title={expanded ? t("collapse_order") : t("expand_order")}
            variant="ghost"
            size="sm"
            className="h-6 px-1.5"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((value) => !value)
            }}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Expandable panel: lazy detail (loading / error / items / notes / sync) */}
      {expanded && (
        <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
          {isLoading && !detail && <p className="text-xs text-muted-foreground">{t("loading_order")}</p>}
          {isError && !detail && <p className="text-xs text-destructive">{t("detail_load_failed")}</p>}
          {detail && items.length > 0 && (
            <div className="space-y-1">
              {detail.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs">{`${item.quantity} × ${item.nameSnapshot}`}</span>
                  <span className="shrink-0 text-xs tabular-nums">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
          {detail?.notes && (
            <p className="text-[11px] break-words text-muted-foreground">
              <span className="font-medium">{t("notes")}:</span> {detail.notes}
            </p>
          )}
          {detail?.needsOutboundSync && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              {t("pending_outbound_sync")}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
