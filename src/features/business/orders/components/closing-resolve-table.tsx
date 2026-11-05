import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Ban, CheckCircle2, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useResolveClosingOrder } from "../hooks/use-order-closings"
import { ORDER_STATUS_CONFIG } from "../types"
import type { OrderClosingOrderRow } from "../types/closing"
import { getApiErrorMessage } from "../utils/order-helpers"
import { ReconcilePaymentsDialog } from "./reconcile-payments-dialog"

/**
 * Órdenes sin estado final (incluye las arrastradas de periodos anteriores):
 * el admin decide si se entregó (y con qué medio se pagó) o si se canceló.
 * Hasta resolverlas no entran a ningún cierre.
 */
export function ClosingResolveTable({ orders }: { orders: OrderClosingOrderRow[] }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()
  const { data: methods } = useQuery({
    queryKey: ["payment-methods", "active", "for-reconcile"],
    queryFn: getActivePaymentMethods,
  })
  const resolve = useResolveClosingOrder()
  const [delivering, setDelivering] = useState<OrderClosingOrderRow | null>(null)
  const [cancelling, setCancelling] = useState<OrderClosingOrderRow | null>(null)
  const [reason, setReason] = useState("")

  const onError = (error: unknown) => notify.error(getApiErrorMessage(error))

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-amber-400/40">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_ref")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("order_customer")}</TableHead>
            <TableHead>{t("breakdown_status")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("settlement_courier")}</TableHead>
            <TableHead className="text-right">{t("order_total")}</TableHead>
            <TableHead className="text-right">{t("closing_resolve_question")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const status = ORDER_STATUS_CONFIG[o.status]
            return (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.reference}</p>
                  {o.carriedOver ? (
                    <Badge tone="orange" className="mt-1 gap-1 text-[10px]">
                      <History className="size-3" />
                      {t("closing_carried_badge", { date: formatDateTime(new Date(o.createdAt)) })}
                    </Badge>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(new Date(o.createdAt))}</p>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{o.customerName ?? "—"}</TableCell>
                <TableCell>
                  <Badge tone={status?.color ?? "neutral"}>{status?.label ?? o.status}</Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">{o.origin}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{o.courierName ?? "—"}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatCurrency(o.total)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" className="h-8" onClick={() => setDelivering(o)} disabled={resolve.isPending}>
                      <CheckCircle2 className="mr-1.5 size-3.5" />
                      {t("closing_resolve_delivered")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        setReason("")
                        setCancelling(o)
                      }}
                      disabled={resolve.isPending}
                    >
                      <Ban className="mr-1.5 size-3.5" />
                      {t("closing_resolve_cancelled")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ReconcilePaymentsDialog
        open={delivering !== null}
        onOpenChange={(open) => !open && setDelivering(null)}
        order={delivering}
        methods={methods ?? []}
        isPending={resolve.isPending}
        title={t("closing_resolve_delivered_title")}
        description={t("closing_resolve_delivered_desc")}
        submitLabel={t("closing_resolve_delivered_submit")}
        onSubmit={(payments) =>
          delivering &&
          resolve.mutate(
            { orderId: delivering.id, outcome: "delivered", payments },
            {
              onSuccess: () => {
                setDelivering(null)
                notify.success(t("closing_resolved_delivered_ok"))
              },
              onError,
            }
          )
        }
      />

      <AlertDialog open={cancelling !== null} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("closing_resolve_cancel_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling &&
                t("closing_resolve_cancel_desc", {
                  reference: cancelling.reference,
                  total: formatCurrency(cancelling.total),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            autoFocus
            placeholder={t("closing_resolve_cancel_reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={resolve.isPending}
              onClick={() =>
                cancelling &&
                resolve.mutate(
                  { orderId: cancelling.id, outcome: "cancelled", reason: reason.trim() || undefined },
                  {
                    onSuccess: () => {
                      setCancelling(null)
                      notify.success(t("closing_resolved_cancelled_ok"))
                    },
                    onError,
                  }
                )
              }
            >
              {t("closing_resolve_cancelled")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
