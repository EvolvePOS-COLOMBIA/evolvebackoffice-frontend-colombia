import { useState } from "react"
import { AlertTriangle, ChevronDown, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { usePaymentMethodNames } from "../hooks/use-payment-method-names"
import type { ClosingSummary } from "../utils/closing-summary"

interface ClosingSummaryPanelProps {
  summary: ClosingSummary
  totalAmount: number
  notes: string
  onNotesChange: (notes: string) => void
  onShowOpen: () => void
  onClose: () => void
  isClosing: boolean
  /** Órdenes del periodo sin estado final: mientras haya alguna el cierre está bloqueado. */
  unresolvedCount?: number
  /** False cuando el periodo ya está cerrado y no hay nada nuevo por agregar. */
  editable?: boolean
}

const SECTION_TITLE = "text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"

/** Side panel of the closing: what will be closed, how it splits by payment method, and the action. */
export function ClosingSummaryPanel({
  summary,
  totalAmount,
  notes,
  onNotesChange,
  onShowOpen,
  onClose,
  isClosing,
  unresolvedCount = 0,
  editable = true,
}: ClosingSummaryPanelProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const methodName = usePaymentMethodNames()
  const [methodsOpen, setMethodsOpen] = useState(true)

  const count = summary.counted.length
  const blocked = unresolvedCount > 0
  const maxMethod = summary.byMethod[0]?.total ?? 0

  return (
    <aside
      aria-label={t("closing_panel_title")}
      className="flex min-h-0 flex-col rounded-xl border border-border/70 bg-background/35"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-0.5">
          <p className={SECTION_TITLE}>{t("closing_panel_total")}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground">{t("closing_orders_included", { count })}</p>
        </div>

        {summary.excludesCancelled ? (
          <div className="flex justify-between gap-3 rounded-lg bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground tabular-nums">
            <span>{t("closing_cancelled_excluded", { count: summary.cancelled.count })}</span>
            <span>{formatCurrency(summary.cancelled.total)}</span>
          </div>
        ) : null}

        {summary.byMethod.length > 0 ? (
          <div>
            <button
              type="button"
              aria-expanded={methodsOpen}
              aria-controls="closing-methods"
              onClick={() => setMethodsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className={SECTION_TITLE}>{t("closing_by_method")}</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {t("closing_methods_count", { count: summary.byMethod.length })}
                <ChevronDown className={cn("size-4 transition-transform", !methodsOpen && "-rotate-90")} />
              </span>
            </button>
            {methodsOpen ? (
              <ul id="closing-methods" className="mt-2.5 space-y-2.5">
                {summary.byMethod.map(({ code, total }) => (
                  <li key={code || "none"} className="space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{methodName(code)}</span>
                      <span className="tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${maxMethod > 0 ? (total / maxMethod) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {summary.open.count > 0 ? (
          <div
            role="status"
            className="space-y-2 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200"
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 shrink-0" />
              {t("closing_open_title", { count: summary.open.count })}
            </p>
            <p className="text-foreground/80 tabular-nums">
              {t("closing_open_body", { total: formatCurrency(summary.open.total) })}
            </p>
            <button
              type="button"
              onClick={onShowOpen}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              {t("closing_open_show")}
            </button>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="closing-notes">{t("closing_notes_label")}</Label>
          <Textarea
            id="closing-notes"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t("notes_placeholder")}
            className="min-h-18 resize-none rounded-[20px]"
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-border/70 p-4">
        <Button className="h-11 w-full" onClick={onClose} disabled={isClosing || count === 0 || blocked || !editable}>
          <Lock className="size-4" />
          {count === 0
            ? t("closing_close_empty")
            : t("closing_close_action", { count, total: formatCurrency(totalAmount) })}
        </Button>
        {blocked ? (
          <p role="status" className="text-center text-[11px] text-amber-700 dark:text-amber-200">
            {t("closing_blocked")}
          </p>
        ) : count > 0 ? (
          <p className="text-center text-[11px] whitespace-nowrap text-muted-foreground">{t("closing_irreversible")}</p>
        ) : null}
      </div>
    </aside>
  )
}
