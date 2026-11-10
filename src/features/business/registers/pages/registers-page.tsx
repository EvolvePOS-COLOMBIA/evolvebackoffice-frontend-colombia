import { useMemo, useRef, useState } from "react"
import { MonitorCog, Plus, RefreshCw, Settings2, SquarePen, AlertTriangle, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { EmptyState } from "@/components/share/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { CreateRegisterDialog } from "@/features/business/registers/components/create-register-dialog"
import { EditRegisterDialog } from "@/features/business/registers/components/edit-register-dialog"
import { SetStatusDialog } from "@/features/business/registers/components/set-status-dialog"
import {
  useCreateRegister,
  useRegisters,
  useSetRegisterStatus,
  useTenantSerialCodes,
  useUpdateRegister,
} from "@/features/business/registers/hooks/use-registers"
import { useBranchTerminalSettings } from "@/features/business/branches/hooks/use-branch-terminals"
import type {
  Register,
  RegisterFormValues,
  RegisterStatus,
  SerialCodeSummaryDto,
} from "@/features/business/registers/types"
import type { CreateRegisterDto, UpdateRegisterDto } from "@/features/business/registers/types/api"

import type { TFunction } from "i18next"

import { notify } from "@/hooks/use-notify"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

const PAGE_SIZE = 10

function statusBadgeTone(status: RegisterStatus) {
  switch (status) {
    case "Active":
      return "success"
    case "Locked":
      return "danger"
    case "Maintenance":
      return "warning"
    case "Inactive":
    default:
      return "neutral"
  }
}

function statusTextKey(status: RegisterStatus) {
  switch (status) {
    case "Active":
      return "status_active"
    case "Locked":
      return "status_locked"
    case "Maintenance":
      return "status_maintenance"
    case "Inactive":
    default:
      return "status_inactive"
  }
}

/** Estados reales de PosSerialCode: Unassigned | Activated | Decommissioned. */
function serialStatusBadgeTone(status: SerialCodeSummaryDto["status"]) {
  switch (status) {
    case "Activated":
      return "success"
    case "Unassigned":
      return "warning"
    default:
      return "neutral"
  }
}

function serialStatusTextKey(status: SerialCodeSummaryDto["status"]) {
  switch (status) {
    case "Activated":
      return "serial_status_activated"
    case "Unassigned":
      return "serial_status_unassigned"
    default:
      return "serial_status_decommissioned"
  }
}

function BranchDisabledWarning({
  branchId,
  t,
  onNavigate,
}: {
  branchId: string | undefined
  t: TFunction
  onNavigate: (branchId: string) => void
}) {
  const { data: settings } = useBranchTerminalSettings(branchId, Boolean(branchId))
  if (!settings || settings.areTerminalsEnabled) return null
  return (
    <Alert variant="default" className="mt-3 border-amber-400/30 bg-amber-500/5">
      <AlertTriangle className="size-4 text-amber-500" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <AlertTitle className="text-amber-600">{t("warning_branch_disabled")}</AlertTitle>
          <AlertDescription className="text-amber-600/80" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => branchId && onNavigate(branchId)}
          className="shrink-0"
        >
          <Settings2 className="size-4" />
          {t("go_to_branch_settings")}
        </Button>
      </div>
    </Alert>
  )
}

export function RegistersPage() {
  const { t } = useTranslation("business-registers")
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [setStatusOpen, setSetStatusOpen] = useState(false)
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null)

  // Búsqueda server-side (searchField=all) con debounce, como en el catálogo.
  const handleSearchChange = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(value.trim())
      setPage(1)
    }, 350)
  }

  const { data: pagedData, isLoading, isError, refetch } = useRegisters(page, PAGE_SIZE, debouncedQuery)
  const {
    data: serials = [],
    isLoading: serialsLoading,
    isError: serialsError,
    refetch: refetchSerials,
  } = useTenantSerialCodes()
  const createMutation = useCreateRegister()
  const updateMutation = useUpdateRegister()
  const setStatusMutation = useSetRegisterStatus()

  const registers = useMemo(() => pagedData?.data ?? [], [pagedData?.data])
  const totalCount = pagedData?.totalCount ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const activeRegisters = useMemo(() => registers.filter((r) => r.status === "Active").length, [registers])

  const uniqueBranchIds = useMemo(() => {
    const set = new Set<string>()
    registers.forEach((r) => {
      if (r.branchPublicId) set.add(r.branchPublicId)
    })
    return Array.from(set)
  }, [registers])

  const handleCreate = (values: RegisterFormValues) => {
    const payload: CreateRegisterDto = {
      name: values.name,
      code: values.code,
      branchPublicId: values.branchPublicId,
      deviceIdentifier: values.deviceIdentifier || null,
      serialCode: values.serialCode || null,
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        notify.success(t("success_created"))
        setCreateOpen(false)
      },
      onError: (error) => {
        notify.error(getApiErrorMessage(error, t("error_save")))
      },
    })
  }

  const handleEdit = (values: RegisterFormValues) => {
    if (!selectedRegister) return
    const payload: UpdateRegisterDto = {
      name: values.name,
      branchPublicId: values.branchPublicId,
      deviceIdentifier: values.deviceIdentifier || null,
      serialCode: values.serialCode || null,
    }
    updateMutation.mutate(
      { id: selectedRegister.id, payload },
      {
        onSuccess: () => {
          notify.success(t("success_updated"))
          setEditOpen(false)
          setSelectedRegister(null)
        },
        onError: (error) => {
          notify.error(getApiErrorMessage(error, t("error_save")))
        },
      }
    )
  }

  const handleSetStatus = (status: RegisterStatus) => {
    if (!selectedRegister) return
    setStatusMutation.mutate(
      { id: selectedRegister.id, status },
      {
        onSuccess: () => {
          notify.success(t("success_status_changed"))
          setSetStatusOpen(false)
          setSelectedRegister(null)
        },
        onError: (error) => {
          notify.error(getApiErrorMessage(error, t("error_save")))
        },
      }
    )
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || setStatusMutation.isPending

  const openEdit = (r: Register) => {
    setSelectedRegister(r)
    setEditOpen(true)
  }

  const openSetStatus = (r: Register) => {
    setSelectedRegister(r)
    setSetStatusOpen(true)
  }

  const goToBranchSettings = (branchId: string) => {
    navigate(`/business/branches/${branchId}/settings/terminals`)
  }

  if (isError && !isLoading) {
    return (
      <div className="space-y-6">
        <ErrorState
          eyebrow="POS Terminals"
          title={t("error_load_title")}
          description={t("error_load_desc")}
          action={
            <Button onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              {t("retry")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("summary")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("page_title")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("page_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t("total_registers")} value={totalCount} loading={isLoading} />
            <SummaryTile label={t("active_registers")} value={activeRegisters} loading={isLoading} />
          </div>
        </CardContent>
      </Card>

      {uniqueBranchIds.length > 0 ? (
        <div className="space-y-3">
          {uniqueBranchIds.map((bid) => (
            <BranchDisabledWarning key={bid} branchId={bid} t={t} onNavigate={goToBranchSettings} />
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("page_title")}</CardTitle>
              <CardDescription>{t("search_placeholder")}</CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)} disabled={isMutating}>
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("search_placeholder")}
              />
            </div>
            <Badge tone="neutral" className="w-fit">
              {totalCount} {t("results")}
            </Badge>
          </div>

          {isLoading ? (
            <RegistersSkeleton />
          ) : registers.length === 0 ? (
            debouncedQuery ? (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={MonitorCog}
                  title={t("no_results")}
                  description={t("search_desc")}
                  action={
                    <Button variant="outline" onClick={() => handleSearchChange("")}>
                      {t("clear_search")}
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={MonitorCog}
                  title={t("empty_title")}
                  description={t("empty_desc")}
                  action={
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="size-4" />
                      {t("create")}
                    </Button>
                  }
                />
              </Card>
            )
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name_label")}</TableHead>
                      <TableHead>{t("code_label")}</TableHead>
                      <TableHead>{t("branch_label")}</TableHead>
                      <TableHead>{t("serial_label")}</TableHead>
                      <TableHead>{t("device_label")}</TableHead>
                      <TableHead>{t("status_label")}</TableHead>
                      <TableHead>{t("last_activity")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.code}</TableCell>
                        <TableCell className="text-muted-foreground">{r.branchName || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{r.serialCode || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.deviceIdentifier || "—"}</TableCell>
                        <TableCell>
                          <Badge tone={statusBadgeTone(r.status)}>{t(statusTextKey(r.status))}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.lastActivityAt ? formatDateTime(r.lastActivityAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(r)}
                              disabled={isMutating}
                            >
                              <SquarePen className="size-4" />
                              {t("edit")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openSetStatus(r)}
                              disabled={isMutating}
                            >
                              <ChevronRight className="size-4 rotate-90" />
                              {t("status_label")}
                            </Button>
                            {r.branchPublicId ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => goToBranchSettings(r.branchPublicId)}
                                disabled={isMutating}
                                title={t("go_to_branch_settings")}
                              >
                                <Settings2 className="size-4" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {registers.map((r) => (
                  <Card key={r.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{r.name}</h3>
                            <Badge tone={statusBadgeTone(r.status)}>{t(statusTextKey(r.status))}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("code_label")}: {r.code}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(r)}
                            disabled={isMutating}
                          >
                            <SquarePen className="size-4" />
                            {t("edit")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openSetStatus(r)}
                            disabled={isMutating}
                          >
                            <ChevronRight className="size-4 rotate-90" />
                            {t("status_label")}
                          </Button>
                          {r.branchPublicId ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => goToBranchSettings(r.branchPublicId)}
                              disabled={isMutating}
                            >
                              <Settings2 className="size-4" />
                              {t("go_to_branch_settings")}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <CompactMeta label={t("branch_label")} value={r.branchName || "—"} />
                        <CompactMeta
                          label={t("last_activity")}
                          value={r.lastActivityAt ? formatDateTime(r.lastActivityAt) : "—"}
                        />
                        {r.deviceIdentifier ? (
                          <CompactMeta label={t("device_label")} value={r.deviceIdentifier} />
                        ) : null}
                        {r.serialCode ? <CompactMeta label={t("serial_label")} value={r.serialCode} /> : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("page_info", { page, totalPages })}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                {t("next")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("serials_pool_title")}</CardTitle>
              <CardDescription>{t("serials_pool_desc")}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchSerials()}>
              <RefreshCw className="size-4" />
              {t("refresh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {serialsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : serialsError ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">{t("error_load_title")}</p>
              <Button variant="outline" size="sm" onClick={() => refetchSerials()}>
                <RefreshCw className="size-4" />
                {t("retry")}
              </Button>
            </div>
          ) : serials.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("serials_pool_empty")}</p>
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("serial_label")}</TableHead>
                      <TableHead>{t("status_label")}</TableHead>
                      <TableHead>{t("device_label")}</TableHead>
                      <TableHead>{t("serials_pool_register")}</TableHead>
                      <TableHead>{t("last_activity")}</TableHead>
                      <TableHead>{t("created")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serials.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.serialCode}</TableCell>
                        <TableCell>
                          <Badge tone={serialStatusBadgeTone(s.status)}>{t(serialStatusTextKey(s.status))}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.deviceName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.isAssignedToRegister ? s.registerName || s.registerCode || "—" : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.lastSeenAt ? formatDateTime(s.lastSeenAt) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(s.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 xl:hidden">
                {serials.map((s) => (
                  <Card key={s.id} className="rounded-2xl border-border/70 bg-background/45 shadow-none">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-medium">{s.serialCode}</span>
                        <Badge tone={serialStatusBadgeTone(s.status)}>{t(serialStatusTextKey(s.status))}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">{t("device_label")}:</span> {s.deviceName || "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("serials_pool_register")}:</span>{" "}
                          {s.isAssignedToRegister ? s.registerName || s.registerCode || "—" : "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("last_activity")}:</span>{" "}
                          {s.lastSeenAt ? formatDateTime(s.lastSeenAt) : "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("created")}:</span> {formatDateTime(s.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreateRegisterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <EditRegisterDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setSelectedRegister(null)
        }}
        registerToEdit={selectedRegister}
        onSubmit={handleEdit}
        isSubmitting={updateMutation.isPending}
      />

      <SetStatusDialog
        open={setStatusOpen}
        onOpenChange={(open) => {
          setSetStatusOpen(open)
          if (!open) setSelectedRegister(null)
        }}
        registerToUpdate={selectedRegister}
        onSubmit={handleSetStatus}
        isSubmitting={setStatusMutation.isPending}
      />
    </div>
  )
}

function SummaryTile({ label, value, loading = false }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-16" />
        ) : (
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function RegistersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="hidden xl:block">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-[24px]" />
        ))}
      </div>
    </div>
  )
}
