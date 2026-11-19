import { Badge } from "@/components/ui/badge"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { usePaymentMethodNames } from "../hooks/use-payment-method-names"
import type { OrderClosingOrderRow } from "../types/closing"
import { shortClosingReference, statusGroup } from "../utils/closing-summary"
import { ClosingStatusBadge } from "./closing-status-badge"

interface ClosingOrdersTableProps {
  orders: OrderClosingOrderRow[]
  /** Cancelled orders are listed but dimmed and flagged when they do not add to the total. */
  cancelledExcluded: boolean
}

const HEAD = "px-3.5 py-2.5 text-left text-[10px] font-semibold tracking-[0.14em] whitespace-nowrap uppercase"

/** Orders of the closing window. Scrolls inside its own box so the header stays in view. */
export function ClosingOrdersTable({ orders, cancelledExcluded }: ClosingOrdersTableProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const methodName = usePaymentMethodNames()

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/70 bg-background/35">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-card text-muted-foreground">
          <tr className="border-b border-border/70">
            <th className={HEAD}>{t("order_ref")}</th>
            <th className={HEAD}>{t("breakdown_status")}</th>
            <th className={HEAD}>{t("breakdown_method")}</th>
            <th className={cn(HEAD, "text-right")}>{t("order_total")}</th>
            <th className={HEAD}>{t("reconciled_state")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                {t("closing_no_results")}
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const dimmed = cancelledExcluded && statusGroup(order.status) === "cancelled"
              return (
                <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.03]">
                  <td className={cn("px-3.5 py-3", dimmed && "opacity-55")}>
                    <div className="font-mono text-xs font-semibold">#{shortClosingReference(order.reference)}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerName ?? t("closing_no_customer")}
                    </div>
                  </td>
                  <td className={cn("px-3.5 py-3", dimmed && "opacity-55")}>
                    <ClosingStatusBadge status={order.status} />
                  </td>
                  <td className={cn("px-3.5 py-3", dimmed && "opacity-55")}>
                    {methodName(order.declaredPaymentMethod)}
                  </td>
                  <td className={cn("px-3.5 py-3 text-right tabular-nums", dimmed && "opacity-55")}>
                    <span className={cn("font-semibold", dimmed && "line-through")}>{formatCurrency(order.total)}</span>
                    {dimmed ? <div className="text-xs text-muted-foreground">{t("closing_not_included")}</div> : null}
                  </td>
                  <td className="px-3.5 py-3">
                    {order.reconciled ? (
                      <Badge tone="success">{t("state_reconciled")}</Badge>
                    ) : (
                      <Badge tone="warning">{t("state_pending")}</Badge>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
