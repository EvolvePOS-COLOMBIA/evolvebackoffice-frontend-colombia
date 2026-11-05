import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { History, Lock, Undo2, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useReconcileOrderPayments } from "../hooks/use-order-closings"
import { ORDER_STATUS_CONFIG } from "../types"
import type { OrderClosingOrderRow, ReconcilePaymentLine } from "../types/closing"
import { getApiErrorMessage } from "../utils/order-helpers"
import { ReconcilePaymentsDialog } from "./reconcile-payments-dialog"

/**
 * Órdenes finalizadas del periodo con su conciliación. Solo las que aún no
 * entraron a un cierre (`editable`) se pueden conciliar; las cerradas son de
 * solo lectura.
 */
export function ClosingOrdersTable({ orders }: { orders: OrderClosingOrderRow[] }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const anyEditable = orders.some((o) => o.editable)
  const { data: methods } = useQuery({
    queryKey: ["payment-methods", "active", "for-reconcile"],
    queryFn: getActivePaymentMethods,
    enabled: anyEditable,
  })
  const reconcileMutation = useReconcileOrderPayments()
  const [editing, setEditing] = useState<OrderClosingOrderRow | null>(null)

  /** Concilia con varios medios (lista vacía = deshacer la conciliación). */
  const savePayments = (order: OrderClosingOrderRow, payments: ReconcilePaymentLine[]) => {
    reconcileMutation.mutate(
      { orderId: order.id, payments },
      {
        onSuccess: () => {
          setEditing(null)
          notify.success(payments.length > 0 ? t("reconciled_ok") : t("unreconciled_ok"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error)),
      }
    )
  }

  /** Resumen de los pagos de la orden: "Efectivo 50.000 (cambio 5.000) + Tarjeta 20.000". */
  const paymentsSummary = (order: OrderClosingOrderRow) =>
    (order.payments ?? [])
      .map((p) => {
        const base = `${p.paymentMethodName ?? p.paymentMethodCode} ${formatCurrency(p.amount)}`
        return p.changeAmount > 0
          ? `${base} (${t("reconcile_change").toLowerCase()} ${formatCurrency(p.changeAmount)})`
          : base
      })
      .join(" + ")

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_ref")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("order_customer")}</TableHead>
            <TableHead>{t("breakdown_status")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("breakdown_method")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("settlement_courier")}</TableHead>
            <TableHead className="text-right">{t("order_total")}</TableHead>
            <TableHead>{t("reconciled_state")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const status = ORDER_STATUS_CONFIG[o.status]
            return (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.reference}</p>
                  {o.carriedOver && (
                    <Badge tone="orange" className="mt-1 gap-1 text-[10px]">
                      <History className="size-3" />
                      {t("closing_carried_short")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{o.customerName ?? "—"}</TableCell>
                <TableCell>
                  <Badge tone={status?.color ?? "neutral"}>{status?.label ?? o.status}</Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">{o.origin}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {o.declaredPaymentMethod ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{o.courierName ?? "—"}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatCurrency(o.total)}</TableCell>
                <TableCell>
                  {o.status === "Cancelled" || o.status === "Refunded" ? (
                    <Badge tone="neutral">{t("cancelled")}</Badge>
                  ) : o.reconciled ? (
                    <div className="flex items-center gap-1.5">
                      <Badge tone="success">
                        {t("state_reconciled")} · {o.reconcilePaymentMethodCode}
                      </Badge>
                      {o.editable && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title={t("reconcile_edit")}
                            aria-label={t("reconcile_edit")}
                            onClick={() => setEditing(o)}
                          >
                            <Wallet className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title={t("unreconcile_action")}
                            aria-label={t("unreconcile_action")}
                            onClick={() => savePayments(o, [])}
                            disabled={reconcileMutation.isPending}
                          >
                            <Undo2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) : o.editable ? (
                    <Button size="sm" className="h-8" onClick={() => setEditing(o)}>
                      <Wallet className="mr-1.5 size-3.5" />
                      {t("reconcile_action")}
                    </Button>
                  ) : (
                    <Badge tone="warning" className="gap-1">
                      <Lock className="size-3" />
                      {t("state_pending")}
                    </Badge>
                  )}
                  {o.reconciled && (o.payments?.length ?? 0) > 0 && (
                    <p className="mt-1 max-w-72 text-[11px] leading-4 text-muted-foreground">{paymentsSummary(o)}</p>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ReconcilePaymentsDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        order={editing}
        methods={methods ?? []}
        isPending={reconcileMutation.isPending}
        onSubmit={(payments) => editing && savePayments(editing, payments)}
      />
    </div>
  )
}
