import { useMemo, useState } from "react"
import { CalendarClock, Check, Coins, Lock, Search } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import { ClosingHistory } from "../components/closing-history"
import { ClosingOrdersTable } from "../components/closing-orders-table"
import { ClosingSummaryPanel } from "../components/closing-summary-panel"
import { useCloseOrders, useOrderClosingPreview, useOrderClosings } from "../hooks/use-order-closings"
import { statusGroup, summarizeClosing, type ClosingStatusGroup } from "../utils/closing-summary"

type ClosingTab = "pending" | "history"
type StatusFilter = "all" | ClosingStatusGroup

const FILTERS: Array<{ value: StatusFilter; labelKey: string }> = [
  { value: "all", labelKey: "closing_filter_all" },
  { value: "open", labelKey: "closing_filter_open" },
  { value: "done", labelKey: "closing_filter_done" },
  { value: "cancelled", labelKey: "closing_filter_cancelled" },
]

/**
 * Cierre de órdenes: cuadre administrativo por ventana [apertura → próxima apertura] de una
 * sucursal. La tabla hace scroll dentro de la tarjeta y el panel con la acción de cierre queda
 * siempre a la vista. La configuración del horario la hace otra persona.
 */
export function OrderClosingPage() {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, formatDateTime } = useLocaleFormat()

  const { data: branchesData } = useBranches(1, 50)
  const branches = useMemo(
    () => (branchesData?.data ?? []).filter((branch) => branch.isActive !== false),
    [branchesData]
  )
  const [pickedBranchId, setPickedBranchId] = useState<string | null>(null)
  const branchId = pickedBranchId ?? branches[0]?.id ?? null

  const [tab, setTab] = useState<ClosingTab>("pending")
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [notes, setNotes] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: preview, isLoading: previewLoading } = useOrderClosingPreview(branchId)
  const { data: closings, isLoading: closingsLoading } = useOrderClosings(branchId)
  const closeMutation = useCloseOrders()

  const summary = useMemo(() => (preview ? summarizeClosing(preview.orders, preview.totalAmount) : null), [preview])

  const visibleOrders = useMemo(() => {
    if (!summary || !preview) return []
    const query = search.trim().toLowerCase().replace("#", "")
    return preview.orders.filter((order) => {
      if (filter !== "all" && statusGroup(order.status) !== filter) return false
      if (!query) return true
      return order.reference.toLowerCase().includes(query) || (order.customerName ?? "").toLowerCase().includes(query)
    })
  }, [summary, preview, filter, search])

  const filterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: 0, open: 0, done: 0, cancelled: 0 }
    for (const order of preview?.orders ?? []) {
      counts.all += 1
      counts[statusGroup(order.status)] += 1
    }
    return counts
  }, [preview])

  const handleBranchChange = (id: string | null) => {
    setPickedBranchId(id)
    setFilter("all")
    setSearch("")
  }

  const handleClose = () => {
    if (!branchId) return
    closeMutation.mutate(
      { branchId, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          setConfirmOpen(false)
          setNotes("")
          setTab("history")
          notify.success(t("closed_ok"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("close_error"))),
      }
    )
  }

  const showPending = tab === "pending"
  const closeCount = summary?.counted.length ?? 0

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/orders", label: t("orders") }}
        title={t("closing_title")}
        description={t("closing_desc")}
        tabs={
          branches.length === 0 ? undefined : (
            <BranchSelector
              options={branches.map((branch) => ({ id: branch.id, name: branch.name }))}
              selectedId={branchId}
              onSelect={handleBranchChange}
            />
          )
        }
        stats={
          preview && summary
            ? [
                { icon: Lock, tone: "primary", label: t("closing_to_close"), value: summary.counted.length },
                { icon: Check, tone: "success", label: t("closing_closed_label"), value: preview.alreadyClosedCount },
                {
                  icon: Coins,
                  tone: "info",
                  label: t("closing_total_label"),
                  value: formatCurrency(preview.totalAmount),
                },
              ]
            : undefined
        }
        heroFooter={
          preview ? (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                {formatDateTime(new Date(preview.window.windowStartLocal))} →{" "}
                {formatDateTime(new Date(preview.window.windowEndLocal))}
              </span>
              <span>
                {t("schedule")} {preview.window.openingTime.slice(0, 5)} – {preview.window.closingTime.slice(0, 5)}
              </span>
              <span>{preview.window.timeZone}</span>
            </p>
          ) : undefined
        }
      >
        {!branchId ? (
          <p className="text-sm text-muted-foreground">{t("select_branch")}</p>
        ) : (
          // Buscador y pestañas viven en la columna izquierda: el panel de cierre sube hasta
          // la altura del buscador y aprovecha todo el alto de la tarjeta.
          <div
            className={cn(
              "grid min-h-0 flex-1 gap-4 max-lg:overflow-y-auto",
              showPending && "lg:grid-cols-[minmax(0,1fr)_344px]"
            )}
          >
            <div className="flex min-h-0 flex-col gap-3 max-lg:min-h-96">
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {showPending ? (
                  <div className="relative max-w-xl min-w-48 flex-1">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("closing_search")}
                      aria-label={t("closing_search")}
                      className="h-8 pl-9 sm:h-9"
                    />
                  </div>
                ) : null}
                <Tabs className="ml-auto" value={tab} onValueChange={(value) => setTab(value as ClosingTab)}>
                  <TabsList>
                    <TabsTrigger value="pending">{t("closing_tab_pending")}</TabsTrigger>
                    <TabsTrigger value="history">
                      {t("closing_tab_history")}
                      {closings && closings.length > 0 ? ` ${closings.length}` : ""}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {!showPending ? (
                <ClosingHistory closings={closings ?? []} isLoading={closingsLoading} />
              ) : previewLoading || !preview || !summary ? (
                <Skeleton className="min-h-48 flex-1 rounded-xl" />
              ) : (
                <>
                  <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label={t("breakdown_status")}>
                    {FILTERS.map(({ value, labelKey }) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={filter === value ? "secondary" : "outline"}
                        aria-pressed={filter === value}
                        className="h-7 rounded-full px-3 text-xs"
                        onClick={() => setFilter(value)}
                      >
                        {t(labelKey)}
                        <span className="tabular-nums opacity-70">{filterCounts[value]}</span>
                      </Button>
                    ))}
                  </div>
                  {preview.orders.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-border/70 text-sm text-muted-foreground">
                      {t("closing_empty")}
                    </div>
                  ) : (
                    <ClosingOrdersTable orders={visibleOrders} cancelledExcluded={summary.excludesCancelled} />
                  )}
                </>
              )}
            </div>

            {showPending ? (
              preview && summary ? (
                <ClosingSummaryPanel
                  summary={summary}
                  totalAmount={preview.totalAmount}
                  notes={notes}
                  onNotesChange={setNotes}
                  onShowOpen={() => setFilter("open")}
                  onClose={() => setConfirmOpen(true)}
                  isClosing={closeMutation.isPending}
                />
              ) : (
                <Skeleton className="min-h-48 rounded-xl" />
              )
            ) : null}
          </div>
        )}
      </EntityListLayout>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("closing_confirm_title")}
        description={t("closing_confirm_desc", {
          count: closeCount,
          total: formatCurrency(preview?.totalAmount ?? 0),
        })}
        confirmLabel={t("closing_confirm_action")}
        tone="default"
        isPending={closeMutation.isPending}
        onConfirm={handleClose}
      />
    </>
  )
}
