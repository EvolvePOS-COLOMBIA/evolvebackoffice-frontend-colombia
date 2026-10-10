import type { ReactNode } from "react"
import { Clock, MapPin, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { ORDER_STATUS_CONFIG } from "../types"
import type { DeliveryOrder } from "../types/delivery"
import { mapsUrl, minutesSince } from "../utils/order-helpers"
import { WhatsAppDesktopDialog } from "./whatsapp-desktop-dialog"
import { DeliveryProofDialog } from "./delivery-proof-dialog"
import { useCanManageDeliveries } from "../hooks/use-delivery-operations"

type DeliveryOrderCardProps = {
  order: DeliveryOrder
  /** Marca de tiempo actual (ms) para los minutos transcurridos. */
  now: number
  showBranch?: boolean
  showStatus?: boolean
  /** Nombre del domiciliario asignado (vista de asignación). */
  courierName?: string | null
  notifyCustomer?: boolean
  actions?: ReactNode
}

/** Tarjeta compacta de un pedido a domicilio (asignación y vista de domicilios). */
export function DeliveryOrderCard({
  order,
  now,
  showBranch = false,
  showStatus = false,
  courierName,
  notifyCustomer = true,
  actions,
}: DeliveryOrderCardProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const url = mapsUrl(order)
  const canManage = useCanManageDeliveries()
  const status = ORDER_STATUS_CONFIG[order.status]

  // En camino: minutos desde la salida; Listo: desde que se creó; Entregado: hora de entrega.
  const elapsed =
    order.status === "Shipped"
      ? minutesSince(order.dispatchedAt, now)
      : order.status === "Ready"
        ? minutesSince(order.readyAt ?? order.createdAt, now)
        : null

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
      {notifyCustomer && <WhatsAppDesktopDialog order={order} courierName={courierName} />}
      {canManage && order.hasDeliveryProof && <DeliveryProofDialog id={order.id} />}
      {order.cancelledWhileDispatched && (
        <p role="alert" className="rounded bg-red-50 p-2 text-sm font-semibold text-red-700">
          {t("phase2_cancelled_on_way")}
        </p>
      )}
      {order.deliveryFailureReason && (
        <p role="alert" className="text-sm text-amber-600">
          {t("phase2_not_delivered")}: {order.deliveryFailureReason}
        </p>
      )}
      {order.promisedDeliveryAt &&
        order.status !== "Delivered" &&
        new Date(order.promisedDeliveryAt).getTime() < now && (
          <p role="alert" className="text-sm text-red-600">
            {t("phase2_late")}
          </p>
        )}
      {order.status === "Ready" && !courierName && elapsed !== null && elapsed >= 15 && (
        <p role="alert" className="text-sm text-amber-600">
          {t("phase2_unassigned_late")}
        </p>
      )}
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
        <Badge tone={order.paymentConfirmed || order.isReconciled ? "success" : "warning"}>
          {order.paymentConfirmed
            ? t("phase2_paid")
            : order.isReconciled
              ? t("phase2_collected")
              : t("phase2_collect", { amount: formatCurrency(order.total) })}
        </Badge>
        {order.platformCode === "CLUVI" && (
          <span title={order.syncError ?? undefined}>
            <Badge
              tone={order.syncStatus === "Error" ? "danger" : order.syncStatus === "Pending" ? "warning" : "success"}
            >
              Cluvi:{" "}
              {t(
                order.syncStatus === "Error"
                  ? "phase2_sync_error"
                  : order.syncStatus === "Pending"
                    ? "phase2_sync_pending"
                    : "phase2_sync_ok"
              )}
            </Badge>
          </span>
        )}
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

      {(order.tipAmount ?? 0) > 0 && (
        <p className="text-xs">
          {t("phase2_tip")}: {formatCurrency(order.tipAmount ?? 0)}
        </p>
      )}
      {(order.changeToCarry ?? 0) > 0 && order.status === "Ready" && (
        <p className="text-sm font-semibold text-amber-600">
          {t("phase2_carry_change", { amount: formatCurrency(order.changeToCarry ?? 0) })}
        </p>
      )}

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
      {order.shippingLatitude != null && order.shippingLongitude != null && (
        <a
          className="text-xs underline"
          target="_blank"
          rel="noreferrer"
          href={`https://waze.com/ul?ll=${order.shippingLatitude},${order.shippingLongitude}&navigate=yes`}
        >
          Waze
        </a>
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
