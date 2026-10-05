import { useMemo, useState } from "react"
import { Copy, Loader2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Markdown } from "@/components/ui/markdown"
import { useExplainLog, useLogDetail } from "../hooks/use-logs"
import { LEVEL_LABEL_KEY, LEVEL_TONE } from "../constants"
import { notify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"
import { getApiErrorMessage } from "@/utils/api-error"
import { useTranslation } from "@/i18n/use-i18n"

interface LogDetailDialogProps {
  /** Id del evento a mostrar; null = cerrado. */
  eventId: number | null
  onOpenChange: (open: boolean) => void
}

export function LogDetailDialog({ eventId, onOpenChange }: LogDetailDialogProps) {
  const { t } = useTranslation("platform-logs")
  const { data, isLoading } = useLogDetail(eventId)
  const explainLog = useExplainLog()
  // Estado indexado por evento: cambiar de evento descarta automáticamente
  // la explicación anterior sin necesidad de un effect con setState.
  const [explanationByEvent, setExplanationByEvent] = useState<{ id: number | null; text: string | null }>({
    id: null,
    text: null,
  })

  const explanation = explanationByEvent.id === eventId ? explanationByEvent.text : null
  const isExplaining = explainLog.isPending && explainLog.variables === eventId
  // Panel lateral visible mientras se genera o cuando ya hay explicación.
  const showExplanationPanel = isExplaining || explanation !== null

  const propertiesJson = data?.propertiesJson

  const properties = useMemo(() => {
    if (!propertiesJson) return null
    try {
      return JSON.stringify(JSON.parse(propertiesJson), null, 2)
    } catch {
      return propertiesJson
    }
  }, [propertiesJson])

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => notify.success(t("copied")))
  }

  const handleExplain = () => {
    if (eventId === null) return
    const targetId = eventId
    explainLog.mutate(targetId, {
      onSuccess: (text) => setExplanationByEvent({ id: targetId, text }),
      onError: (error) => notify.error(getApiErrorMessage(error, t("explain_error"))),
    })
  }

  // El componente no se desmonta al cerrar el modal: sin este reset, la
  // segunda columna reaparecería sin pulsar el botón al reabrir el mismo
  // evento. Solo se muestra tras pedir la explicación en esta apertura.
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) setExplanationByEvent({ id: null, text: null })
  }

  return (
    <Dialog open={eventId !== null} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-x-hidden overflow-y-auto",
          // El ancho base del diálogo es w-[min(92vw,720px)]; con el panel de
          // la IA al costado se ensancha para que quepan las dos columnas.
          showExplanationPanel && "w-[min(96vw,1152px)] max-w-6xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {data ? <Badge tone={LEVEL_TONE[data.level] ?? "neutral"}>{t(LEVEL_LABEL_KEY[data.level])}</Badge> : null}
            <span className="truncate">{t("detail_title")}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("detail_title")}</DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isExplaining}
                onClick={handleExplain}
              >
                {isExplaining ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {isExplaining ? t("explaining") : explanation ? t("explain_again") : t("explain_with_ai")}
              </Button>
            </div>

            {/* Dos columnas SOLO con el panel de la IA; sin él, una sola
                columna a ancho completo (sin hueco a la derecha). */}
            <div className={cn("grid gap-4", showExplanationPanel && "lg:grid-cols-2 lg:items-start")}>
              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <Meta label={t("date")} value={formatDateTime(data.timestampUtc)} />
                  <Meta
                    label={t("duration")}
                    value={data.elapsedMs != null ? `${Math.round(data.elapsedMs)} ms` : "—"}
                  />
                  <Meta label={t("tenant_col")} value={data.tenantId ?? t("no_tenant")} />
                  <Meta
                    label={t("path")}
                    value={
                      data.requestPath
                        ? `${data.requestMethod ? `${data.requestMethod} ` : ""}${data.requestPath}`
                        : "—"
                    }
                  />
                  <Meta label={t("status_code")} value={data.statusCode != null ? String(data.statusCode) : "—"} />
                  <Meta label={t("source")} value={data.source ?? "—"} />
                  <Meta label={t("service")} value={`${data.serviceName} · ${data.environment} · v${data.version}`} />
                  <Meta
                    label={t("trace_id")}
                    value={data.traceId ?? "—"}
                    copyValue={data.traceId ?? undefined}
                    onCopy={copy}
                  />
                </div>

                <Section title={t("full_message")} text={data.message} copyValue={data.message} onCopy={copy} />

                {data.messageTemplate && data.messageTemplate !== data.message ? (
                  <Section title={t("message_template")} text={data.messageTemplate} />
                ) : null}

                <Section
                  title={t("exception")}
                  text={data.exception}
                  empty={t("no_exception")}
                  danger
                  copyValue={data.exception ?? undefined}
                  onCopy={copy}
                />

                <Section
                  title={t("properties")}
                  text={properties}
                  empty={t("no_properties")}
                  copyValue={properties ?? undefined}
                  onCopy={copy}
                />
              </div>

              {showExplanationPanel ? (
                <aside
                  className={cn(
                    "order-first min-w-0 space-y-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3",
                    "dark:border-violet-900/50 dark:bg-violet-950/25",
                    // En pantallas anchas el panel pasa al costado derecho;
                    // en resoluciones pequeñas queda arriba (junto al botón).
                    "lg:order-none"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300">
                      <Sparkles className="size-3.5 text-violet-500" />
                      {t("ai_explanation")}
                    </p>
                    {explanation ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={`${t("copy")} ${t("ai_explanation")}`}
                        onClick={() => copy(explanation)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>

                  {isExplaining ? (
                    <div className="flex items-center gap-2 rounded-lg border border-violet-200/70 bg-background/60 p-3 text-xs text-muted-foreground dark:border-violet-900/50">
                      <Loader2 className="size-4 animate-spin text-violet-500" />
                      {t("explaining_hint")}
                    </div>
                  ) : explanation ? (
                    <Markdown
                      id={`log-explain-${eventId ?? "none"}`}
                      className="prose prose-sm max-w-none text-[11px] dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    >
                      {explanation}
                    </Markdown>
                  ) : null}
                </aside>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Meta({
  label,
  value,
  copyValue,
  onCopy,
}: {
  label: string
  value: string
  copyValue?: string
  onCopy?: (text: string) => void
}) {
  const { t } = useTranslation("platform-logs")
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-0.5 flex items-start gap-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-foreground">{value}</span>
        {copyValue && onCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5 shrink-0"
            aria-label={`${t("copy")} ${label}`}
            onClick={() => onCopy(copyValue)}
          >
            <Copy className="size-3" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Section({
  title,
  text,
  empty,
  danger,
  copyValue,
  onCopy,
}: {
  title: string
  text: string | null
  empty?: string
  danger?: boolean
  copyValue?: string
  onCopy?: (text: string) => void
}) {
  const { t } = useTranslation("platform-logs")

  if (!text) {
    return empty ? (
      <div className="space-y-1.5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
        <p className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">{empty}</p>
      </div>
    ) : null
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
        {copyValue && onCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`${t("copy")} ${title}`}
            onClick={() => onCopy(copyValue)}
          >
            <Copy className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <pre
        className={cn(
          "max-h-48 overflow-auto rounded-xl border border-border/70 bg-muted/40 p-3 text-xs [overflow-wrap:anywhere] whitespace-pre-wrap",
          danger && "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        )}
      >
        {text}
      </pre>
    </div>
  )
}
