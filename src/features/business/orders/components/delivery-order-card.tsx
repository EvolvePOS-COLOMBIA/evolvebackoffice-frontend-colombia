import type { ReactNode } from "react"
import { Clock, MapPin, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { ORDER_STATUS_CONFIG } from "../types"
import type { DeliveryOrder } from "../types/delivery"
import { mapsUrl, minutesSince } from "../utils/order-helpers"

type DeliveryOrderCardProps = {
  order: DeliveryOrder
  /** Marca de tiempo actual (ms) para los minutos transcurridos. */
  now: number
  showBranch?: boolean
  showStatus?: boolean
  /** Nombre del domiciliario asignado (vista de asignación). */
  courierName?: string | null
  actions?: ReactNode
}

/** Tarjeta compacta de un pedido a domicilio (asignación y vista de domicilios). */
export function DeliveryOrderCard({
  order,
  now,
  showBranch = false,
  showStatus = false,
  courierName,
  actions,
}: DeliveryOrderCardProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const url = mapsUrl(order)
  const status = ORDER_STATUS_CONFIG[order.status]

  // En camino: minutos desde la salida; Listo: desde que se creó; Entregado: hora de entrega.
  const elapsed =
    order.status === "Shipped"
      ? minutesSince(order.dispatchedAt, now)
      : order.status === "Ready"
        ? minutesSince(order.createdAt, now)
        : null

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate font-mono text-xs text-muted-foreground">#{order.reference}</span>
          <p className="truncate text-sm font-medium">{order.customerName ?? t("courier_no_customer")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums">{formatCurrency(order.total)}</span>
          {showStatus && status && (
            <Badge tone={status.color} className="text-[10px]">
              {status.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge tone="neutral" className="text-[10px]">
          {order.origin ?? order.platformCode}
        </Badge>
        {order.paymentMethod && (
          <Badge tone="warning" className="text-[10px]">
            {order.paymentMethod}
          </Badge>
        )}
        {showBranch && order.branchName && (
          <Badge tone="info" className="max-w-28 truncate text-[10px]">
            {order.branchName}
          </Badge>
        )}
        {courierName && (
          <Badge tone="purple" className="max-w-32 truncate text-[10px]">
            {courierName}
          </Badge>
        )}
      </div>

      {(order.shippingStreet || order.shippingCity) && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-2 underline-offset-2 hover:text-foreground hover:underline"
            >
              {[order.shippingStreet, order.shippingCity].filter(Boolean).join(", ")}
            </a>
          ) : (
            <span className="line-clamp-2">
              {[order.shippingStreet, order.shippingCity].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
      )}
      {order.shippingNotes && (
        <p className="line-clamp-2 text-xs text-muted-foreground italic">{order.shippingNotes}</p>
      )}

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="size-3" />
              {order.customerPhone}
            </a>
          )}
          {elapsed !== null && (
            <span className={`flex items-center gap-1 ${elapsed >= 45 ? "font-semibold text-rose-500" : ""}`}>
              <Clock className="size-3" />
              {t("minutes_ago", { count: elapsed })}
            </span>
          )}
        </span>
        {order.shippingCost > 0 && (
          <span>
            {t("shipping_cost")}: {formatCurrency(order.shippingCost)}
          </span>
        )}
      </div>

      {actions && <div className="flex justify-end gap-1.5 pt-1">{actions}</div>}
    </div>
  )
}
