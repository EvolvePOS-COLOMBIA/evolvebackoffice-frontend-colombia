import { useEffect, useMemo, useState } from "react"
import { ChevronRight, Fingerprint, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AuditDetailDialog } from "../components/audit-detail-dialog"
import { useAuditLogs, useAuditTenants } from "../hooks/use-audit"
import { AUDIT_ACTIONS, actionTone, actorTypeTone } from "../constants"
import type { AuditFilters, AuditLogItem } from "../types"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

const PAGE_SIZE = 20
const ALL = "all"

export function AuditPage() {
  const { t } = useTranslation("platform-audit")

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tenantId, setTenantId] = useState<string>(ALL)
  const [action, setAction] = useState<string>(ALL)
  const [entityType, setEntityType] = useState("")
  const [succeeded, setSucceeded] = useState<string>(ALL)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<AuditLogItem | null>(null)

  // Búsqueda con debounce para no golpear la API en cada tecla
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Cualquier cambio de filtro vuelve a la página 1
  const filtersKey = JSON.stringify([search, tenantId, action, entityType, succeeded, from, to])
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey)
  if (filtersKey !== prevFiltersKey) {
    setPrevFiltersKey(filtersKey)
    setPage(1)
  }

  const filters: AuditFilters = useMemo(
    () => ({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      tenantId: tenantId === ALL ? undefined : tenantId,
      action: action === ALL ? undefined : action,
      entityType: entityType || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      search: search || undefined,
      succeeded: succeeded === ALL ? undefined : succeeded === "true",
    }),
    [page, tenantId, action, entityType, from, to, search, succeeded]
  )

  const { data: paged, isLoading, refetch } = useAuditLogs(filters)
  const { data: tenantOptions } = useAuditTenants()

  const entries = paged?.data ?? []
  const totalPages = paged?.totalPages ?? 1
  const totalCount = paged?.totalCount ?? 0
  const hasFilters =
    search !== "" ||
    tenantId !== ALL ||
    action !== ALL ||
    entityType !== "" ||
    succeeded !== ALL ||
    from !== "" ||
    to !== ""

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setTenantId(ALL)
    setAction(ALL)
    setEntityType("")
    setSucceeded(ALL)
    setFrom("")
    setTo("")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-2xl border border-border/70 bg-accent/60">
                  <Fingerprint className="size-4.5 text-muted-foreground" />
                </span>
                <Badge tone="neutral">{t("total_events", { total: totalCount })}</Badge>
              </div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("audit")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("audit_desc")}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              {t("refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-0">
          <div className="space-y-1">
            <CardTitle>{t("filters")}</CardTitle>
            <CardDescription>{t("search_placeholder")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="audit-search">{t("search_label")}</Label>
            <Input
              id="audit-search"
              type="search"
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
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
            <Label>{t("action")}</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("all_actions")}</SelectItem>
                {AUDIT_ACTIONS.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-entity">{t("entity_type")}</Label>
            <Input
              id="audit-entity"
              type="text"
              placeholder={t("entity_type_placeholder")}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("succeeded")}</Label>
            <Select value={succeeded} onValueChange={setSucceeded}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("all_results")}</SelectItem>
                <SelectItem value="true">{t("result_ok")}</SelectItem>
                <SelectItem value="false">{t("result_failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-from">{t("from")}</Label>
            <Input id="audit-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-to">{t("to")}</Label>
            <Input id="audit-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" onClick={clearFilters} disabled={!hasFilters}>
              {t("clear_filters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      <Card>
        <CardHeader className="pb-0">
          <div className="space-y-1">
            <CardTitle>{t("events")}</CardTitle>
            <CardDescription>{t("events_desc")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Fingerprint className="size-6" />
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
                      <TableHead className="w-44">{t("action_col")}</TableHead>
                      <TableHead className="w-36">{t("entity")}</TableHead>
                      <TableHead>{t("actor")}</TableHead>
                      <TableHead className="w-48">{t("tenant_col")}</TableHead>
                      <TableHead className="w-28">{t("result")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} className="cursor-pointer" onClick={() => setDetail(entry)}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.createdAtUtc)}
                        </TableCell>
                        <TableCell>
                          <Badge tone={actionTone(entry.action, entry.succeeded)}>{entry.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-36 truncate text-sm">{entry.entityType}</TableCell>
                        <TableCell className="max-w-52">
                          <span className="flex flex-col gap-0.5">
                            <span className="truncate text-sm font-medium">
                              {entry.actorName || t("unknown_actor")}
                            </span>
                            <Badge className="w-fit" tone={actorTypeTone(entry.actorType)}>
                              {entry.actorType}
                            </Badge>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                          {entry.tenantId ?? t("no_tenant")}
                        </TableCell>
                        <TableCell>
                          <Badge tone={entry.succeeded ? "success" : "danger"}>
                            {entry.succeeded ? t("result_ok") : t("result_failed")}
                          </Badge>
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

      <AuditDetailDialog
        entry={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      />
    </div>
  )
}
