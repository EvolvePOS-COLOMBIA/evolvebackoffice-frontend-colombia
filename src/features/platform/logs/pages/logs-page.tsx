import { useEffect, useMemo, useState } from "react"
import { ChevronRight, RefreshCw, ScrollText, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LogDetailDialog } from "../components/log-detail-dialog"
import { useLogSummary, useLogTenants, useLogs } from "../hooks/use-logs"
import { LEVEL_LABEL_KEY, LEVEL_TONE, LOG_LEVELS, STATUS_LABEL_KEY, STATUS_TONE } from "../constants"
import type { LogsFilters } from "../types"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

const PAGE_SIZE = 20
const AUTO_REFRESH_MS = 15_000
const ALL = "all"

export function LogsPage() {
  const { t } = useTranslation("platform-logs")

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [level, setLevel] = useState<string>(ALL)
  const [tenantId, setTenantId] = useState<string>(ALL)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [detailId, setDetailId] = useState<number | null>(null)

  // Búsqueda con debounce para no golpear la API en cada tecla
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Cualquier cambio de filtro vuelve a la página 1
  const filtersKey = JSON.stringify([search, level, tenantId, from, to])
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey)
  if (filtersKey !== prevFiltersKey) {
    setPrevFiltersKey(filtersKey)
    setPage(1)
  }

  const filters: LogsFilters = useMemo(
    () => ({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      level: level === ALL ? undefined : level,
      tenantId: tenantId === ALL ? undefined : tenantId,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      search: search || undefined,
    }),
    [page, level, tenantId, from, to, search]
  )

  const refetchInterval = autoRefresh ? AUTO_REFRESH_MS : false
  const { data: paged, isLoading, refetch } = useLogs(filters, refetchInterval)
  const { data: summary, refetch: refetchSummary } = useLogSummary(refetchInterval)
  const { data: tenantOptions } = useLogTenants()

  const logs = paged?.data ?? []
  const totalPages = paged?.totalPages ?? 1
  const totalCount = paged?.totalCount ?? 0
  const hasFilters = search !== "" || level !== ALL || tenantId !== ALL || from !== "" || to !== ""

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setLevel(ALL)
    setTenantId(ALL)
    setFrom("")
    setTo("")
    setPage(1)
  }

  const statusLabel = summary ? t(STATUS_LABEL_KEY[summary.status]) : t("status_unknown")
  const statusTone = summary ? STATUS_TONE[summary.status] : "neutral"

  return (
    <div className="space-y-6">
      {/* Cabecera: estado del servicio + resumen */}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone}>
                <span className="size-1.5 rounded-full bg-current" />
                {t("service_status")}: {statusLabel}
              </Badge>
              <Badge tone="neutral">{`${t("total_window")}: ${summary?.total ?? 0}`}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("logs")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("logs_desc")}</p>
            </div>
            {summary?.lastErrorAt ? (
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{t("last_error")}:</span>{" "}
                  {formatDateTime(summary.lastErrorAt)} — {summary.lastErrorMessage}
                  {summary.lastErrorTenantId ? ` (${summary.lastErrorTenantId})` : ""}
                </span>
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <SummaryTile label={t("errors_window")} value={summary?.errors ?? 0} tone="danger" />
            <SummaryTile label={t("warnings_window")} value={summary?.warnings ?? 0} tone="warning" />
            <SummaryTile label={t("requests_window")} value={summary?.requests ?? 0} />
            <SummaryTile
              label={t("avg_response")}
              value={summary?.avgElapsedMs != null ? `${Math.round(summary.avgElapsedMs)} ms` : "—"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("filters")}</CardTitle>
              <CardDescription>{t("search_placeholder")}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
                {t("clear_filters")}
              </Button>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-1.5">
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Label htmlFor="auto-refresh" className="cursor-pointer text-xs text-muted-foreground">
                  {t("auto_refresh")}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
            <Label htmlFor="logs-search">{t("message")}</Label>
            <Input
              id="logs-search"
              type="search"
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("level")}</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("all_levels")}</SelectItem>
                {LOG_LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {t(LEVEL_LABEL_KEY[lvl])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("tenant")}</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("all_tenants")}</SelectItem>
                {(tenantOptions ?? []).map((opt) => (
                  <SelectItem key={opt.tenantId} value={opt.tenantId}>
                    {t("tenant_with_count", { tenantId: opt.tenantId, count: opt.count })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logs-from">{t("from")}</Label>
            <Input id="logs-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logs-to">{t("to")}</Label>
            <Input id="logs-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("events")}</CardTitle>
              <CardDescription>{t("events_desc")}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t("total_events", { total: totalCount })}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch()
                  void refetchSummary()
                }}
              >
                <RefreshCw className="size-4" />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <ScrollText className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{t("no_events")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("no_events_desc")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">{t("date")}</TableHead>
                      <TableHead className="w-28">{t("level")}</TableHead>
                      <TableHead>{t("message")}</TableHead>
                      <TableHead className="w-52">{t("path")}</TableHead>
                      <TableHead className="w-40">{t("tenant_col")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="cursor-pointer" onClick={() => setDetailId(log.id)}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatDateTime(log.timestampUtc)}
                        </TableCell>
                        <TableCell>
                          <Badge tone={LEVEL_TONE[log.level] ?? "neutral"}>{t(LEVEL_LABEL_KEY[log.level])}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <span className="flex items-center gap-1.5">
                            {log.hasException ? (
                              <TriangleAlert
                                className="size-3.5 shrink-0 text-red-500"
                                aria-label={t("events_with_exception")}
                              />
                            ) : null}
                            <span className="truncate">{log.message}</span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-52">
                          {log.requestPath ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="shrink-0 font-medium">{log.requestMethod}</span>
                              <span className="truncate">{log.requestPath}</span>
                              {log.statusCode != null ? (
                                <Badge
                                  tone={
                                    log.statusCode >= 500 ? "danger" : log.statusCode >= 400 ? "warning" : "neutral"
                                  }
                                >
                                  {log.statusCode}
                                </Badge>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                          {log.tenantId ?? t("no_tenant")}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{t("page_of", { page, totalPages })}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("next_page")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <LogDetailDialog
        eventId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      />
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number | string; tone?: "danger" | "warning" }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        <p
          className={
            tone === "danger"
              ? "mt-3 text-3xl font-semibold text-red-600 dark:text-red-400"
              : tone === "warning"
                ? "mt-3 text-3xl font-semibold text-amber-600 dark:text-amber-400"
                : "mt-3 text-3xl font-semibold text-foreground"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
