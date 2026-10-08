import { useMemo } from "react"
import { Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { actionTone, actorTypeTone } from "../constants"
import type { AuditLogItem } from "../types"
import { notify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

interface AuditDetailDialogProps {
  /** Evento a mostrar; null = cerrado (la fila ya trae old/new values). */
  entry: AuditLogItem | null
  onOpenChange: (open: boolean) => void
}

function prettyJson(raw: string | null): string | null {
  if (!raw) return null
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export function AuditDetailDialog({ entry, onOpenChange }: AuditDetailDialogProps) {
  const { t } = useTranslation("platform-audit")

  const oldValues = useMemo(() => prettyJson(entry?.oldValues ?? null), [entry])
  const newValues = useMemo(() => prettyJson(entry?.newValues ?? null), [entry])

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => notify.success(t("copied")))
  }

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("detail_title")}</DialogTitle>
          <DialogDescription>
            {entry ? `${t("event_label")}: ${entry.action} · ${formatDateTime(entry.createdAtUtc)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {entry ? (
          <div className="space-y-5">
            {/* Metadatos */}
            <div className="grid gap-3 rounded-2xl border border-border/70 p-4 text-sm sm:grid-cols-2">
              <MetaItem label={t("action_label")}>
                <Badge tone={actionTone(entry.action, entry.succeeded)}>{entry.action}</Badge>
              </MetaItem>
              <MetaItem label={t("result_label")}>
                <Badge tone={entry.succeeded ? "success" : "danger"}>
                  {entry.succeeded ? t("result_ok") : t("result_failed")}
                </Badge>
              </MetaItem>
              <MetaItem label={t("entity_label")}>
                <span className="font-medium">{entry.entityType}</span>
                {entry.entityPublicId ? (
                  <span className="block truncate font-mono text-xs text-muted-foreground">{entry.entityPublicId}</span>
                ) : null}
              </MetaItem>
              <MetaItem label={t("actor_label")}>
                <span className="font-medium">{entry.actorName || t("unknown_actor")}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={actorTypeTone(entry.actorType)}>{entry.actorType}</Badge>
                  {entry.actorPublicId ? (
                    <span className="truncate font-mono text-xs text-muted-foreground">{entry.actorPublicId}</span>
                  ) : null}
                </span>
              </MetaItem>
              <MetaItem label={t("tenant_label")}>
                {entry.tenantId ? (
                  <span className="font-medium">
                    {entry.tenantName ? `${entry.tenantName} · ` : ""}
                    {entry.tenantId}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("no_tenant")}</span>
                )}
              </MetaItem>
              <MetaItem label={t("date_label")}>{formatDateTime(entry.createdAtUtc)}</MetaItem>
              <MetaItem label={t("ip")}>
                <span className="font-mono text-xs">{entry.ipAddress ?? "-"}</span>
              </MetaItem>
              <MetaItem label={t("trace_id")}>
                <span className="truncate font-mono text-xs">{entry.traceId ?? "-"}</span>
              </MetaItem>
              {entry.userAgent ? (
                <div className="sm:col-span-2">
                  <MetaItem label={t("user_agent")}>
                    <span className="font-mono text-xs break-all">{entry.userAgent}</span>
                  </MetaItem>
                </div>
              ) : null}
              {entry.errorMessage ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("error_message")}</p>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{entry.errorMessage}</p>
                </div>
              ) : null}
            </div>

            {/* Old / New values */}
            <div className="grid gap-4 md:grid-cols-2">
              <ValuesPanel
                title={t("old_values")}
                values={oldValues}
                onCopy={copy}
                emptyLabel={t("no_values")}
                tone="old"
              />
              <ValuesPanel
                title={t("new_values")}
                values={newValues}
                onCopy={copy}
                emptyLabel={t("no_values")}
                tone="new"
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  )
}

function ValuesPanel({
  title,
  values,
  onCopy,
  emptyLabel,
  tone,
}: {
  title: string
  values: string | null
  onCopy: (text: string) => void
  emptyLabel: string
  tone: "old" | "new"
}) {
  return (
    <div className="rounded-2xl border border-border/70">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{title}</p>
        {values ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onCopy(values)}>
            <Copy className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <pre
        className={cn(
          "max-h-72 overflow-auto p-4 font-mono text-xs leading-5 break-all whitespace-pre-wrap",
          values ? "text-foreground" : "text-muted-foreground",
          values && tone === "old" && "bg-red-50/60 dark:bg-red-950/20",
          values && tone === "new" && "bg-emerald-50/60 dark:bg-emerald-950/20"
        )}
      >
        {values ?? emptyLabel}
      </pre>
    </div>
  )
}
