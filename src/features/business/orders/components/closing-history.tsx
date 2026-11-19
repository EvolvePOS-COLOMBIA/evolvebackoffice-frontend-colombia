import { useState } from "react"
import { Check, Undo2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useQuery } from "@tanstack/react-query"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useOrderClosingDetail, useReconcileOrder } from "../hooks/use-order-closings"
import { usePaymentMethodNames } from "../hooks/use-payment-method-names"
import type { OrderClosing, OrderClosingOrderRow } from "../types/closing"
import { shortClosingReference } from "../utils/closing-summary"
import { ClosingStatusBadge } from "./closing-status-badge"

interface ClosingHistoryProps {
  closings: OrderClosing[]
  isLoading: boolean
}

/** Past closings, newest first. Each one expands into its orders so they can be reconciled. */
export function ClosingHistory({ closings, isLoading }: ClosingHistoryProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()
  const [openId, setOpenId] = useState<string | null>(null)
  const { data: detail } = useOrderClosingDetail(openId)

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>
  if (closings.length === 0) return <p className="text-sm text-muted-foreground">{t("history_empty")}</p>

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
      {closings.map((closing) => {
        const open = openId === closing.id
        const progress = closing.ordersCount > 0 ? (closing.reconciledCount / closing.ordersCount) * 100 : 0
        return (
          <article key={closing.id} className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold tabular-nums">
                  {formatDateTime(new Date(closing.windowStart))} → {formatDateTime(new Date(closing.windowEnd))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {closing.ordersCount} {t("history_orders")} · {formatCurrency(closing.totalAmount)} ·{" "}
                  {t("history_closed_by")} {closing.closedBy}
                  {closing.notes ? ` · “${closing.notes}”` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : closing.id)}
              >
                {open ? t("closing_hide") : t("reconcile_action")}
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {closing.reconciledCount}/{closing.ordersCount} {t("history_reconciled")}
              </span>
              <div className="h-1.5 max-w-56 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {open && detail && detail.closing.id === closing.id ? (
              <div className="border-t border-border/70 pt-3">
                <ClosingReconcileTable orders={detail.orders} closingId={detail.closing.id} />
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function ClosingReconcileTable({ orders, closingId }: { orders: OrderClosingOrderRow[]; closingId: string }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const methodName = usePaymentMethodNames()
  const { data: methods } = useQuery({
    queryKey: ["payment-methods", "active", "for-reconcile"],
    queryFn: getActivePaymentMethods,
  })
  const reconcileMutation = useReconcileOrder(closingId)
  const [selected, setSelected] = useState<Record<string, string>>({})

  const handleReconcile = (order: OrderClosingOrderRow, reconciled: boolean) => {
    const code = reconciled ? selected[order.id] : undefined
    if (reconciled && !code) {
      notify.error(t("reconcile_method"))
      return
    }
    reconcileMutation.mutate(
      { orderId: order.id, reconciled, paymentMethodCode: code },
      {
        onSuccess: () => notify.success(reconciled ? t("reconciled_ok") : t("unreconciled_ok")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("reconcile_error"))),
      }
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          <tr className="border-b border-border/70 text-left">
            <th className="px-3 py-2 font-semibold">{t("order_ref")}</th>
            <th className="px-3 py-2 font-semibold">{t("breakdown_status")}</th>
            <th className="px-3 py-2 font-semibold">{t("breakdown_method")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("order_total")}</th>
            <th className="px-3 py-2 font-semibold">{t("reconciled_state")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2.5">
                <div className="font-mono text-xs font-semibold">#{shortClosingReference(order.reference)}</div>
                <div className="text-xs text-muted-foreground">{order.customerName ?? t("closing_no_customer")}</div>
              </td>
              <td className="px-3 py-2.5">
                <ClosingStatusBadge status={order.status} />
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{methodName(order.declaredPaymentMethod)}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatCurrency(order.total)}</td>
              <td className="px-3 py-2.5">
                {order.reconciled ? (
                  <div className="flex items-center gap-1.5">
                    <Badge tone="success">
                      {t("state_reconciled")} · {methodName(order.reconcilePaymentMethodCode)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={t("unreconcile_action")}
                      title={t("unreconcile_action")}
                      onClick={() => handleReconcile(order, false)}
                    >
                      <Undo2 className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selected[order.id] ?? ""}
                      onValueChange={(value) => setSelected((current) => ({ ...current, [order.id]: value }))}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder={t("reconcile_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(methods ?? []).map((method) => (
                          <SelectItem key={method.id} value={method.code}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8"
                      aria-label={t("reconcile_action")}
                      onClick={() => handleReconcile(order, true)}
                      disabled={reconcileMutation.isPending}
                    >
                      <Check className="size-3.5" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
