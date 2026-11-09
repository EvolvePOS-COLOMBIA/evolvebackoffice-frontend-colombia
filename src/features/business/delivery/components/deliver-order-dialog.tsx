import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/use-i18n"
import { notify } from "@/hooks/use-notify"
import { formatCurrency } from "@/utils/format"
import { getApiErrorMessage } from "@/utils/api-error"
import { useOrderDetail } from "@/features/business/orders/hooks/use-orders"
import type { OrderListItem } from "@/features/business/orders/types/api"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useDeliverOrder } from "../hooks/use-delivery"
import { ADVANCE_MODE, type DeliverOrderResponseDto } from "../types"

type DeliverOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderListItem | null
  /** Modelo de anticipo de la sucursal (`ADVANCE_MODE.Advance` = 0 habilita la devolución). */
  advanceMode?: number
  onDelivered?: (result: DeliverOrderResponseDto) => void
}

type PaymentRow = {
  key: number
  code: string
  amount: string
  reference: string
}

let rowKey = 0

/**
 * Registro de entrega de un pedido con domiciliario: cobro del comprador por uno
 * o varios medios de pago (pago mixto o cambio de medio), con decisión de
 * devolución del anticipo cuando la sucursal opera en modelo con anticipo.
 *
 * Los pagos deben sumar exactamente el total del pedido (validación en cliente,
 * el backend la repite). El efectivo cobrado se registra en el turno del
 * domiciliario; la propina no se contabiliza.
 */
export function DeliverOrderDialog({
  open,
  onOpenChange,
  order,
  advanceMode = ADVANCE_MODE.Advance,
  onDelivered,
}: DeliverOrderDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const { data: orderDetail, isLoading: orderLoading } = useOrderDetail(open && order ? order.id : "")
  const { data: paymentMethods = [], isLoading: methodsLoading } = useQuery({
    queryKey: ["payment-methods", "active"],
    queryFn: getActivePaymentMethods,
    enabled: open,
    staleTime: 60_000,
  })
  const deliverMutation = useDeliverOrder()

  const [rows, setRows] = useState<PaymentRow[]>([])
  const [returnAdvance, setReturnAdvance] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  const total = orderDetail?.total ?? order?.total ?? 0

  // Precarga por apertura/pedido: un pago en efectivo por el total con el primer
  // medio de efectivo. Ajuste durante el render (patrón de user-form-dialog), en
  // vez de setState en un efecto; el "seed" identifica apertura + pedido + medios.
  const [prevSeed, setPrevSeed] = useState<string | null>(null)
  const seed = open ? `${order?.id ?? ""}|${methodsLoading ? "loading" : paymentMethods.length}` : null
  if (seed !== prevSeed) {
    setPrevSeed(seed)
    if (seed === null) {
      setRows([])
      setReturnAdvance(false)
      setRefundAmount("")
      setError(null)
    } else if (!methodsLoading && paymentMethods.length > 0) {
      const cash = paymentMethods.find((m) => m.isCash) ?? paymentMethods[0]
      setRows([{ key: ++rowKey, code: cash.code, amount: total ? String(total) : "", reference: "" }])
      setReturnAdvance(false)
      setRefundAmount("")
      setError(null)
    }
  }

  const paid = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0), [rows])
  const cashReceived = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const method = paymentMethods.find((m) => m.code === r.code)
        return method?.isCash ? sum + (Number(r.amount) || 0) : sum
      }, 0),
    [rows, paymentMethods]
  )
  const remaining = total - paid
  const defaultRefund = total - cashReceived
  const showAdvance = advanceMode === ADVANCE_MODE.Advance

  const addRow = () => {
    const next = paymentMethods.find((m) => !rows.some((r) => r.code === m.code)) ?? paymentMethods[0]
    setRows((prev) => [...prev, { key: ++rowKey, code: next?.code ?? "", amount: "", reference: "" }])
  }

  const updateRow = (key: number, patch: Partial<PaymentRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const removeRow = (key: number) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))

  const handleConfirm = () => {
    if (rows.length === 0) {
      setError(t("deliver_payments_required"))
      return
    }
    for (const row of rows) {
      const amount = Number(row.amount)
      if (!row.amount.trim() || Number.isNaN(amount) || amount <= 0) {
        setError(t("deliver_amount_invalid"))
        return
      }
      const method = paymentMethods.find((m) => m.code === row.code)
      if (!method) {
        setError(t("deliver_method_required"))
        return
      }
      if (method.requiresReference && !row.reference.trim()) {
        setError(t("deliver_reference_required"))
        return
      }
    }
    // La suma de los pagos debe cuadrar con el total (tolerancia de centavos).
    if (Math.abs(paid - total) > 0.01) {
      setError(t("deliver_sum_mismatch", { total: formatCurrency(total) }))
      return
    }
    setError(null)

    const refund = refundAmount.trim() ? Number(refundAmount.trim()) : null
    deliverMutation.mutate(
      {
        orderId: order!.id,
        payload: {
          payments: rows.map((r) => ({
            paymentMethodCode: r.code,
            amount: Number(r.amount),
            reference: r.reference.trim() ? r.reference.trim() : null,
          })),
          returnAdvance: showAdvance && returnAdvance,
          advanceRefundAmount: showAdvance && returnAdvance ? refund : null,
        },
      },
      {
        onSuccess: (result) => {
          notify.success(
            result.cashCollected > 0
              ? t("deliver_success_cash", { cash: formatCurrency(result.cashCollected) })
              : t("deliver_success")
          )
          onOpenChange(false)
          onDelivered?.(result)
        },
        onError: (err) => notify.error(getApiErrorMessage(err, t("action_failed"))),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("deliver_title")}
            {order ? ` #${order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}` : ""}
          </DialogTitle>
          <DialogDescription>{t("deliver_desc")}</DialogDescription>
        </DialogHeader>

        {orderLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {t("order_total")}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{formatCurrency(total)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {t("deliver_paid_total")}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{formatCurrency(paid)}</p>
                {Math.abs(remaining) > 0.01 ? (
                  <Badge tone={remaining > 0 ? "warning" : "danger"} className="mt-1 text-[10px]">
                    {t("deliver_remaining")}: {formatCurrency(remaining)}
                  </Badge>
                ) : (
                  <Badge tone="success" className="mt-1 text-[10px]">
                    {tCommon("success")}
                  </Badge>
                )}
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("deliver_payments_title")}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <Plus className="mr-1 size-3.5" />
                  {t("deliver_add_payment")}
                </Button>
              </div>

              <div className="space-y-2">
                {rows.map((row) => {
                  const method = paymentMethods.find((m) => m.code === row.code)
                  return (
                    <div
                      key={row.key}
                      className="grid grid-cols-2 items-end gap-2 rounded-2xl border border-border/70 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">{t("deliver_payment_method")}</Label>
                        <Select value={row.code} onValueChange={(code) => updateRow(row.key, { code })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => (
                              <SelectItem key={m.code} value={m.code}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("deliver_amount")}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          value={row.amount}
                          placeholder="0"
                          onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("deliver_reference")}
                          {method?.requiresReference ? " *" : ""}
                        </Label>
                        <Input
                          value={row.reference}
                          onChange={(e) => updateRow(row.key, { reference: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        title={t("deliver_remove_payment")}
                        onClick={() => removeRow(row.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </section>

            {showAdvance ? (
              <section className="space-y-2 rounded-2xl border border-border/70 p-3">
                <h3 className="text-sm font-semibold">{t("deliver_advance_title")}</h3>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={returnAdvance}
                    onCheckedChange={(checked) => setReturnAdvance(checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    {t("deliver_return_advance")}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("deliver_return_advance_hint")}
                    </span>
                  </span>
                </label>
                {returnAdvance ? (
                  <div className="space-y-1">
                    <Label className="text-xs">{t("deliver_refund_amount")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="decimal"
                      value={refundAmount}
                      placeholder={String(defaultRefund > 0 ? defaultRefund : 0)}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("deliver_refund_hint", { amount: formatCurrency(Math.max(defaultRefund, 0)) })}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={orderLoading || deliverMutation.isPending} onClick={handleConfirm}>
            {deliverMutation.isPending ? tCommon("saving") : t("deliver_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
