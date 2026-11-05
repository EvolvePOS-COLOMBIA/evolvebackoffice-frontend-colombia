import { useMemo, useState } from "react"
import { CalendarClock, Check, ClipboardCheck, Lock, Undo2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useQuery } from "@tanstack/react-query"
import {
  useCloseOrders,
  useOrderClosingDetail,
  useOrderClosingPreview,
  useOrderClosings,
  useReconcileOrder,
} from "../hooks/use-order-closings"
import type { OrderClosingOrderRow } from "../types/closing"

/**
 * F6 — Cierre de órdenes: cuadre administrativo por ventana
 * [apertura → próxima apertura]. La configuración del horario la hace otra
 * persona; aquí solo se consulta y se cierra/concilia.
 */
export function OrderClosingPage() {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()

  const { data: branchesData } = useBranches(1, 50)
  const branches = useMemo(() => branchesData?.data ?? [], [branchesData])
  const [branchId, setBranchId] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [prevFirstBranchId, setPrevFirstBranchId] = useState<string | null>(null)

  // Congela la sucursal por defecto en el primer load (antes vivía en un
  // useEffect que ya no permite react-hooks/set-state-in-effect). Ajuste de
  // estado en render: si la lista de sucursales cambia después, la rama ya
  // congelada/la selección del usuario no se mueven solas.
  const firstBranchId = branches[0]?.id ?? ""
  if (firstBranchId !== prevFirstBranchId) {
    setPrevFirstBranchId(firstBranchId)
    if (!branchId && firstBranchId) setBranchId(firstBranchId)
  }

  const effectiveBranchId = branchId || firstBranchId

  const { data: preview, isLoading: previewLoading } = useOrderClosingPreview(effectiveBranchId || null)
  const { data: closings, isLoading: closingsLoading } = useOrderClosings(effectiveBranchId || null)
  const { data: detail } = useOrderClosingDetail(detailId)
  const closeMutation = useCloseOrders()

  const handleClose = () => {
    if (!effectiveBranchId || !preview || preview.ordersCount === 0) return
    if (!window.confirm(t("close_confirm"))) return
    closeMutation.mutate(
      { branchId: effectiveBranchId, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setNotes("")
          setDetailId(null)
          notify.success(t("closed_ok"))
        },
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("orders")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("closing_title")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("closing_desc")}</p>
          <Lock
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:w-80">
            <Select value={effectiveBranchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder={t("select_branch")} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!effectiveBranchId ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("select_branch")}</p>
        ) : previewLoading || !preview ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Ventana + horario (solo lectura) */}
            <section className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-2 sm:p-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <CalendarClock className="size-3.5" />
                  {t("window")}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDateTime(new Date(preview.window.windowStartLocal))} →{" "}
                  {formatDateTime(new Date(preview.window.windowEndLocal))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("window_hint")} · {t("timezone")}: {preview.window.timeZone}
                </p>
              </div>
              <div className="text-sm sm:text-right">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("schedule")}</p>
                <p className="mt-1 font-mono">
                  {preview.window.openingTime} → {preview.window.closingTime}
                </p>
              </div>
            </section>

            {/* Cifras */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Figure label={t("pending_orders")} value={String(preview.ordersCount)} accent />
              <Figure label={t("already_closed")} value={String(preview.alreadyClosedCount)} />
              <Figure label={t("total_orders")} value={String(preview.ordersCount)} />
              <Figure label={t("window_total")} value={formatCurrency(preview.totalAmount)} />
            </div>

            {/* Desglose */}
            <section className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("breakdown")}</p>
              {preview.breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_orders")}</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("breakdown_origin")}</TableHead>
                        <TableHead>{t("breakdown_status")}</TableHead>
                        <TableHead>{t("breakdown_method")}</TableHead>
                        <TableHead className="text-center">{t("total_orders")}</TableHead>
                        <TableHead className="text-right">{t("order_total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.breakdown.map((row) => (
                        <TableRow key={`${row.origin}-${row.status}-${row.paymentMethod}`}>
                          <TableCell className="font-medium">{row.origin}</TableCell>
                          <TableCell>
                            <Badge tone="neutral">{row.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.paymentMethod}</TableCell>
                          <TableCell className="text-center tabular-nums">{row.count}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Órdenes pendientes */}
            <section className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("orders_list")}</p>
              {preview.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("closing_empty")}</p>
              ) : (
                <OrderRowsTable orders={preview.orders} showReconcile={false} closingId={null} />
              )}
            </section>

            {/* Acción de cierre */}
            <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-end sm:p-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="closing-notes">
                  {t("notes")}
                </label>
                <Input
                  id="closing-notes"
                  placeholder={t("notes_placeholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleClose} disabled={closeMutation.isPending || preview.ordersCount === 0}>
                <Lock className="mr-2 size-4" />
                {t("close_action")}
              </Button>
            </section>

            {/* Historial */}
            <section className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("history")}</p>
              {closingsLoading ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : !closings || closings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("history_empty")}</p>
              ) : (
                <div className="space-y-2">
                  {closings.map((c) => (
                    <div key={c.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatDateTime(new Date(c.windowStart))} → {formatDateTime(new Date(c.windowEnd))}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {c.ordersCount} {t("history_orders")} · {formatCurrency(c.totalAmount)} ·{" "}
                            {c.reconciledCount}/{c.ordersCount} {t("history_reconciled")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("history_closed_by")}: {c.closedBy}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailId(detailId === c.id ? null : c.id)}
                          >
                            <ClipboardCheck className="mr-1.5 size-4" />
                            {t("open_detail")}
                          </Button>
                        </div>
                      </div>
                      {c.notes && <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>}

                      {detailId === c.id && detail && detail.closing.id === c.id && (
                        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                          <div className="grid gap-2 rounded-lg bg-muted/40 p-2 sm:grid-cols-4">
                            {detail.closing.breakdown.map((row) => (
                              <p key={`${row.origin}-${row.status}-${row.paymentMethod}`} className="text-xs">
                                <span className="font-medium">{row.origin}</span> · {row.status} · {row.paymentMethod}:{" "}
                                <span className="font-mono">{row.count}</span> ={" "}
                                <span className="font-mono">{formatCurrency(row.total)}</span>
                              </p>
                            ))}
                          </div>
                          <OrderRowsTable orders={detail.orders} showReconcile closingId={detail.closing.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Figure({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 text-center">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={`text-base font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

function OrderRowsTable({
  orders,
  showReconcile,
  closingId,
}: {
  orders: OrderClosingOrderRow[]
  showReconcile: boolean
  closingId: string | null
}) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const { data: methods } = useQuery({
    queryKey: ["payment-methods", "active", "for-reconcile"],
    queryFn: getActivePaymentMethods,
    enabled: showReconcile,
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
        onError: (error) => notify.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("order_ref")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("order_customer")}</TableHead>
            <TableHead>{t("breakdown_origin")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("breakdown_status")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("breakdown_method")}</TableHead>
            <TableHead className="text-right">{t("order_total")}</TableHead>
            <TableHead>{t("reconciled_state")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs">{o.reference}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{o.customerName ?? "—"}</TableCell>
              <TableCell>{o.origin}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge tone="neutral">{o.status}</Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {o.declaredPaymentMethod ?? "—"}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatCurrency(o.total)}</TableCell>
              <TableCell>
                {o.reconciled ? (
                  <div className="flex items-center gap-1.5">
                    <Badge tone="success">
                      {t("state_reconciled")} · {o.reconcilePaymentMethodCode}
                    </Badge>
                    {showReconcile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title={t("unreconcile_action")}
                        onClick={() => handleReconcile(o, false)}
                      >
                        <Undo2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ) : showReconcile ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selected[o.id] ?? ""}
                      onValueChange={(v) => setSelected((s) => ({ ...s, [o.id]: v }))}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder={t("reconcile_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(methods ?? []).map((m) => (
                          <SelectItem key={m.id} value={m.code}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => handleReconcile(o, true)}
                      disabled={reconcileMutation.isPending}
                    >
                      <Check className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Badge tone="warning">{t("state_pending")}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response
    return response?.data?.message ?? response?.data?.error ?? "Error"
  }
  return "Error"
}
