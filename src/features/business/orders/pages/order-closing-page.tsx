import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Bike,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  History,
  Lock,
  RefreshCw,
  Wallet,
} from "lucide-react"

import Spinner from "@/components/Spinner"
import { StatTile } from "@/components/share"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import {
  useCloseOrders,
  useOrderClosingDetail,
  useOrderClosingPreview,
  useOrderClosings,
} from "../hooks/use-order-closings"
import { useOrderUpdates } from "../hooks/use-order-updates"
import { ClosingOrdersTable } from "../components/closing-orders-table"
import { ClosingResolveTable } from "../components/closing-resolve-table"
import { CourierSettlementsTable } from "../components/courier-settlements-table"
import { PaymentTotalsTable } from "../components/payment-totals-table"
import { isFinalOrderStatus, type OrderClosing } from "../types/closing"
import { getApiErrorMessage } from "../utils/order-helpers"

type ReconcileFilter = "pending" | "reconciled" | "all"

/**
 * F6 — Cierre de órdenes del periodo ACTUAL [apertura → próxima apertura].
 * Flujo: 1) resolver las órdenes sin estado final (incluidas las arrastradas
 * de periodos anteriores), 2) conciliar cómo se pagó cada una, 3) cerrar.
 * Un cierre generado es de solo lectura.
 */
export function OrderClosingPage() {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()

  const { data: branchesData } = useBranches(1, 50)
  const branches = useMemo(() => branchesData?.data ?? [], [branchesData])
  const [branchId, setBranchId] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [filter, setFilter] = useState<ReconcileFilter>("pending")

  const effectiveBranchId = branchId || branches[0]?.id || ""

  const {
    data: preview,
    isLoading: previewLoading,
    isFetching,
    refetch,
  } = useOrderClosingPreview(effectiveBranchId || null)
  const { data: closings, isLoading: closingsLoading } = useOrderClosings(effectiveBranchId || null)
  const closeMutation = useCloseOrders()
  // Pedidos nuevos o cambios de estado (webhook, otro usuario) se reflejan sin recargar.
  useOrderUpdates(effectiveBranchId || null)

  const groups = useMemo(() => {
    const orders = preview?.orders ?? []
    const unresolved = orders.filter((o) => o.editable && !isFinalOrderStatus(o.status))
    const finished = orders.filter((o) => isFinalOrderStatus(o.status))
    const delivered = finished.filter((o) => o.status === "Delivered")
    const toReconcile = delivered.filter((o) => o.editable && !o.reconciled)
    const closable = finished.filter((o) => o.editable)
    return {
      unresolved,
      finished,
      delivered,
      toReconcile,
      closable,
      closableTotal: closable.filter((o) => o.status === "Delivered").reduce((acc, o) => acc + o.total, 0),
      reconciledCount: delivered.filter((o) => o.reconciled).length,
    }
  }, [preview])

  const visibleFinished =
    filter === "all"
      ? groups.finished
      : filter === "reconciled"
        ? groups.finished.filter((o) => o.reconciled)
        : groups.finished.filter((o) => o.status === "Delivered" && !o.reconciled)

  const isClosed = preview?.status === "Closed"
  const canClose = !!preview && !isClosed && groups.closable.length > 0

  const handleClose = () => {
    if (!effectiveBranchId || !canClose) return
    closeMutation.mutate(
      { branchId: effectiveBranchId, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setNotes("")
          setConfirmOpen(false)
          notify.success(t("closed_ok"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error)),
      }
    )
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Badge className="max-w-fit" tone="primary">
              {t("orders")}
            </Badge>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("closing_title")}</h1>
            <p className="max-w-3xl text-sm leading-5 text-muted-foreground">{t("closing_desc")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <Select value={effectiveBranchId} onValueChange={setBranchId}>
                <SelectTrigger aria-label={t("select_branch")}>
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
            <Button variant="outline" onClick={() => refetch()} disabled={!effectiveBranchId || isFetching}>
              <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>
        </div>

        {!effectiveBranchId ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("select_branch")}</p>
        ) : previewLoading || !preview ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Periodo actual */}
            <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="size-4 text-primary" />
                {t("current_period")}: {formatDateTime(new Date(preview.window.windowStartLocal))} →{" "}
                {formatDateTime(new Date(preview.window.windowEndLocal))}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("timezone")}: {preview.window.timeZone}
              </p>
            </div>

            {isClosed && (
              <Alert variant="info">
                <Lock />
                <AlertTitle>{t("closing_period_closed_title")}</AlertTitle>
                <AlertDescription>{t("closing_period_closed_desc")}</AlertDescription>
              </Alert>
            )}
            {(preview.carriedOverCount ?? 0) > 0 && (
              <Alert variant="warning">
                <History />
                <AlertTitle>{t("closing_carried_title", { count: preview.carriedOverCount })}</AlertTitle>
                <AlertDescription>{t("closing_carried_desc")}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <StatTile
                label={t("closing_kpi_unresolved")}
                value={groups.unresolved.length}
                icon={AlertTriangle}
                tone={groups.unresolved.length > 0 ? "warning" : "muted"}
              />
              <StatTile
                label={t("closing_kpi_to_reconcile")}
                value={groups.toReconcile.length}
                icon={Wallet}
                tone={groups.toReconcile.length > 0 ? "info" : "muted"}
              />
              <StatTile
                label={t("closing_kpi_reconciled")}
                value={`${groups.reconciledCount}/${groups.delivered.length}`}
                icon={CheckCircle2}
                tone="success"
              />
              <StatTile label={t("window_total")} value={formatCurrency(preview.totalAmount)} tone="primary" />
            </div>

            {/* Paso 1: órdenes sin estado final */}
            {groups.unresolved.length > 0 && (
              <Section
                step={1}
                title={t("closing_step_resolve")}
                hint={t("closing_step_resolve_hint")}
                icon={<AlertTriangle className="size-4 text-amber-500" />}
              >
                <ClosingResolveTable orders={groups.unresolved} />
              </Section>
            )}

            {/* Paso 2: conciliación */}
            <Section
              step={groups.unresolved.length > 0 ? 2 : 1}
              title={t("closing_step_reconcile")}
              hint={t("closing_step_reconcile_hint")}
              icon={<Wallet className="size-4 text-primary" />}
              action={
                <Tabs value={filter} onValueChange={(v) => setFilter(v as ReconcileFilter)}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      {t("closing_filter_pending")} ({groups.toReconcile.length})
                    </TabsTrigger>
                    <TabsTrigger value="reconciled">
                      {t("closing_filter_reconciled")} ({groups.reconciledCount})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      {t("closing_filter_all")} ({groups.finished.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            >
              {visibleFinished.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 py-8 text-center text-sm text-muted-foreground">
                  {filter === "pending" ? t("closing_nothing_to_reconcile") : t("closing_empty")}
                </p>
              ) : (
                <ClosingOrdersTable orders={visibleFinished} />
              )}
            </Section>

            {/* Cuadre */}
            <Section
              title={t("settlement_title")}
              hint={t("settlement_hint")}
              icon={<Bike className="size-4 text-primary" />}
            >
              <CourierSettlementsTable rows={preview.courierSettlements ?? []} />
            </Section>
            <Section title={t("totals_title")} hint={t("totals_hint")}>
              <div className="max-w-2xl">
                <PaymentTotalsTable rows={preview.paymentTotals ?? []} />
              </div>
            </Section>

            {/* Paso final: cierre */}
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1 space-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Lock className="size-4 text-primary" />
                    {t("closing_step_close")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isClosed
                      ? t("closing_already_closed")
                      : t("closing_close_summary", {
                          count: groups.closable.length,
                          total: formatCurrency(groups.closableTotal),
                        })}
                  </p>
                  {!isClosed && groups.unresolved.length > 0 && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-300">
                      {t("closing_close_unresolved_warning", { count: groups.unresolved.length })}
                    </p>
                  )}
                  {!isClosed && groups.toReconcile.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("closing_close_unreconciled_warning", { count: groups.toReconcile.length })}
                    </p>
                  )}
                </div>
                {!isClosed && (
                  <div className="flex flex-col gap-2 sm:flex-row lg:w-[460px]">
                    <Input
                      aria-label={t("notes")}
                      placeholder={t("notes_placeholder")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button onClick={() => setConfirmOpen(true)} disabled={!canClose || closeMutation.isPending}>
                      <Lock className="mr-2 size-4" />
                      {t("close_action")}
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <details className="group rounded-xl border border-border/60">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                {t("breakdown")}
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-1 border-t border-border/60 p-4">
                {preview.breakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("no_orders")}</p>
                ) : (
                  preview.breakdown.map((row) => (
                    <p
                      key={`${row.origin}-${row.status}-${row.paymentMethod}`}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{row.origin}</span> · {row.status} · {row.paymentMethod} (
                        {row.count})
                      </span>
                      <span className="font-mono tabular-nums">{formatCurrency(row.total)}</span>
                    </p>
                  ))
                )}
              </div>
            </details>

            <Section title={t("history")} icon={<ClipboardCheck className="size-4 text-muted-foreground" />}>
              {closingsLoading ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : !closings || closings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("history_empty")}</p>
              ) : (
                <div className="space-y-2">
                  {closings.map((c) => (
                    <HistoryItem key={c.id} closing={c} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("close_action")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("close_confirm_detail", {
                  count: groups.closable.length,
                  total: formatCurrency(groups.closableTotal),
                })}
                {groups.unresolved.length > 0 &&
                  ` ${t("closing_close_unresolved_warning", { count: groups.unresolved.length })}`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose} disabled={closeMutation.isPending}>
                {t("close_action")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

function Section({
  step,
  title,
  hint,
  icon,
  action,
  children,
}: {
  step?: number
  title: string
  hint?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {step !== undefined && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {step}
              </span>
            )}
            {icon}
            {title}
          </h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Cierre generado: cabecera + detalle de solo lectura bajo demanda. */
function HistoryItem({ closing: c }: { closing: OrderClosing }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()
  const [open, setOpen] = useState(false)
  const { data: detail, isLoading } = useOrderClosingDetail(open ? c.id : null)

  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">
            {formatDateTime(new Date(c.windowStart))} → {formatDateTime(new Date(c.windowEnd))}
          </p>
          <p className="text-xs text-muted-foreground">
            {c.ordersCount} {t("history_orders")} · {formatCurrency(c.totalAmount)} · {c.reconciledCount}/
            {c.ordersCount} {t("history_reconciled")} · {t("history_closed_by")}: {c.closedBy}
          </p>
          {c.notes && <p className="mt-1 text-xs text-muted-foreground italic">{c.notes}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ClipboardCheck className="mr-1.5 size-4" />
          {open ? t("close_detail") : t("open_detail")}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
          {isLoading || !detail ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <>
              {(detail.closing.courierSettlements?.length ?? 0) > 0 && (
                <CourierSettlementsTable rows={detail.closing.courierSettlements ?? []} />
              )}
              <ClosingOrdersTable orders={detail.orders} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
