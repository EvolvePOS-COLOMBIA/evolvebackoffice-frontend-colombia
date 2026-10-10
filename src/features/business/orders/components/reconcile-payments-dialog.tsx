import { useState } from "react"
import { Plus, Trash2, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { PaymentMethodResponseDto } from "@/features/business/payment-methods/types"
import type { OrderClosingOrderRow, ReconcilePaymentLine } from "../types/closing"

/** Tolerancia de redondeo (igual a la del backend). */
const TOLERANCE = 0.01

type Line = {
  key: number
  code: string
  amount: string
  reference: string
  tendered: string
}

type ReconcilePaymentsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderClosingOrderRow | null
  methods: PaymentMethodResponseDto[]
  isPending?: boolean
  onSubmit: (payments: ReconcilePaymentLine[]) => void
}

/**
 * Conciliación de una orden con varios medios de pago. En los medios en
 * efectivo se registra lo que entregó el cliente y se muestra el cambio.
 * Solo se monta abierto: cada apertura arranca con los pagos de la orden.
 */
export function ReconcilePaymentsDialog(props: ReconcilePaymentsDialogProps) {
  return props.open && props.order ? <ReconcilePaymentsDialogInner {...props} order={props.order} /> : null
}

function toNumber(value: string): number {
  const n = Number(value.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function initialLines(order: OrderClosingOrderRow, methods: PaymentMethodResponseDto[]): Line[] {
  if (order.payments && order.payments.length > 0) {
    return order.payments.map((p, i) => ({
      key: i,
      code: p.paymentMethodCode,
      amount: String(p.amount),
      reference: p.reference ?? "",
      tendered: p.tenderedAmount != null ? String(p.tenderedAmount) : "",
    }))
  }
  // Sugerencia: el medio declarado si coincide con el catálogo; si no, efectivo.
  const declared = (order.declaredPaymentMethod ?? "").trim().toLowerCase()
  const match =
    methods.find((m) => m.code.toLowerCase() === declared || m.name.toLowerCase() === declared) ??
    methods.find((m) => m.isCash) ??
    methods[0]
  return [{ key: 0, code: match?.code ?? "", amount: String(order.total), reference: "", tendered: "" }]
}

function ReconcilePaymentsDialogInner({
  open,
  onOpenChange,
  order,
  methods,
  isPending = false,
  onSubmit,
}: ReconcilePaymentsDialogProps & { order: OrderClosingOrderRow }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const [lines, setLines] = useState<Line[]>(() => initialLines(order, methods))
  const [nextKey, setNextKey] = useState(lines.length)

  const methodOf = (code: string) => methods.find((m) => m.code === code)
  const sum = round2(lines.reduce((acc, l) => acc + toNumber(l.amount), 0))
  const remaining = round2(order.total - sum)
  const totalChange = round2(
    lines.reduce((acc, l) => {
      const tendered = toNumber(l.tendered)
      return methodOf(l.code)?.isCash && l.tendered && tendered > toNumber(l.amount)
        ? acc + (tendered - toNumber(l.amount))
        : acc
    }, 0)
  )

  const errors: string[] = []
  if (lines.some((l) => !l.code)) errors.push(t("reconcile_err_method"))
  if (lines.some((l) => toNumber(l.amount) <= 0)) errors.push(t("reconcile_err_amount"))
  if (Math.abs(remaining) > TOLERANCE) errors.push(t("reconcile_err_sum"))
  if (lines.some((l) => l.tendered && toNumber(l.tendered) < toNumber(l.amount)))
    errors.push(t("reconcile_err_tendered"))
  if (lines.some((l) => methodOf(l.code)?.requiresReference && !l.reference.trim()))
    errors.push(t("reconcile_err_reference"))

  const update = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const addLine = () => {
    const cashUsed = lines.some((l) => methodOf(l.code)?.isCash)
    const suggestion = methods.find((m) => (cashUsed ? !m.isCash : m.isCash)) ?? methods[0]
    setLines((prev) => [
      ...prev,
      {
        key: nextKey,
        code: suggestion?.code ?? "",
        amount: remaining > 0 ? String(remaining) : "",
        reference: "",
        tendered: "",
      },
    ])
    setNextKey((k) => k + 1)
  }

  const handleSubmit = () => {
    if (errors.length > 0) return
    onSubmit(
      lines.map((l) => ({
        paymentMethodCode: l.code,
        amount: round2(toNumber(l.amount)),
        reference: l.reference.trim() || null,
        tenderedAmount: methodOf(l.code)?.isCash && l.tendered ? round2(toNumber(l.tendered)) : null,
      }))
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            {t("reconcile_title")}
          </DialogTitle>
          <DialogDescription>
            #{order.reference} · {order.customerName ?? "—"} · {t("order_total")}{" "}
            <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {lines.map((line) => {
            const method = methodOf(line.code)
            const change =
              method?.isCash && line.tendered ? round2(toNumber(line.tendered) - toNumber(line.amount)) : null
            return (
              <div key={line.key} className="space-y-2 rounded-xl border border-border/60 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                  <Select value={line.code} onValueChange={(v) => update(line.key, { code: v, tendered: "" })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("reconcile_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => (
                        <SelectItem key={m.id} value={m.code}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    inputMode="decimal"
                    className="h-9 text-right font-mono"
                    placeholder={t("reconcile_amount")}
                    value={line.amount}
                    onChange={(e) => update(line.key, { amount: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    disabled={lines.length === 1}
                    aria-label={t("remove_line")}
                    title={t("remove_line")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {method?.isCash ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-muted-foreground">
                      {t("reconcile_tendered")}
                      <Input
                        inputMode="decimal"
                        className="h-9 text-right font-mono"
                        placeholder={line.amount || "0"}
                        value={line.tendered}
                        onChange={(e) => update(line.key, { tendered: e.target.value })}
                      />
                    </label>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {t("reconcile_change")}
                      <p
                        className={`flex h-9 items-center justify-end rounded-md border border-border/60 bg-muted/40 px-3 font-mono text-sm font-semibold ${
                          change !== null && change < 0 ? "text-rose-500" : "text-foreground"
                        }`}
                      >
                        {change === null ? "—" : formatCurrency(change)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Input
                    className="h-9"
                    placeholder={
                      method?.requiresReference ? t("reconcile_reference_required") : t("reconcile_reference")
                    }
                    value={line.reference}
                    onChange={(e) => update(line.key, { reference: e.target.value })}
                  />
                )}
              </div>
            )
          })}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={addLine} disabled={methods.length === 0}>
              <Plus className="mr-1.5 size-4" />
              {t("reconcile_add_method")}
            </Button>
            {remaining !== 0 && lines.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const last = lines[lines.length - 1]
                  update(last.key, { amount: String(round2(toNumber(last.amount) + remaining)) })
                }}
              >
                {t("reconcile_fill_remaining")}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center text-xs">
            <div>
              <p className="font-semibold tracking-wider text-muted-foreground uppercase">{t("reconcile_paid")}</p>
              <p className="font-mono text-sm font-bold">{formatCurrency(sum)}</p>
            </div>
            <div>
              <p className="font-semibold tracking-wider text-muted-foreground uppercase">{t("reconcile_remaining")}</p>
              <p
                className={`font-mono text-sm font-bold ${Math.abs(remaining) > TOLERANCE ? "text-rose-500" : "text-emerald-500"}`}
              >
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <p className="font-semibold tracking-wider text-muted-foreground uppercase">{t("reconcile_change")}</p>
              <p className="font-mono text-sm font-bold">{formatCurrency(totalChange)}</p>
            </div>
          </div>

          {errors.length > 0 && (
            <ul className="space-y-0.5 text-xs text-rose-500">
              {[...new Set(errors)].map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={errors.length > 0 || isPending}>
            {t("reconcile_action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
