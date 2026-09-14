import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Building2,
  Lock,
  MonitorCog,
  Save,
  Unlock,
} from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getBranchById } from "@/features/business/branches/services/branches.service"
import {
  useActivateBranchTerminals,
  useBranchRegisters,
  useBranchTerminalSettings,
  useDeactivateBranchTerminals,
  useUpsertBranchTerminalSettings,
} from "@/features/business/branches/hooks/use-branch-terminals"
import type { RegisterStatus } from "@/features/business/registers/types"

import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

function statusBadgeTone(status: string) {
  switch (status) {
    case "Active":
      return "success"
    case "Locked":
      return "danger"
    case "Maintenance":
      return "warning"
    default:
      return "neutral"
  }
}

function statusTextKey(status: string) {
  switch (status) {
    case "Active":
      return "status_active"
    case "Locked":
      return "status_locked"
    case "Maintenance":
      return "status_maintenance"
    default:
      return "status_inactive"
  }
}

export function BranchTerminalSettingsPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("business-branches-terminals")

  const [maxOverride, setMaxOverride] = useState<number | null>(null)
  const [enabledOverride, setEnabledOverride] = useState<boolean | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    data: branch,
    isLoading: branchLoading,
    isError: branchError,
  } = useQuery({
    queryKey: ["branches", "detail", branchId],
    queryFn: () => getBranchById(branchId!),
    enabled: Boolean(branchId),
  })

  const {
    data: settings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useBranchTerminalSettings(branchId)

  const {
    data: registers = [],
    isLoading: registersLoading,
    refetch: refetchRegisters,
  } = useBranchRegisters(branchId)

  const upsertMutation = useUpsertBranchTerminalSettings()
  const deactivateMutation = useDeactivateBranchTerminals()
  const activateMutation = useActivateBranchTerminals()

  const localMax = useMemo(
    () => maxOverride ?? settings?.maxTerminals ?? 3,
    [maxOverride, settings?.maxTerminals]
  )
  const localEnabled = useMemo(
    () => enabledOverride ?? settings?.areTerminalsEnabled ?? true,
    [enabledOverride, settings?.areTerminalsEnabled]
  )
  const isDirty = useMemo(
    () => maxOverride !== null || enabledOverride !== null,
    [maxOverride, enabledOverride]
  )

  const branchName = branch?.name ?? ""

  const handleMaxChange = (raw: string) => {
    const n = Number(raw)
    const next = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
    setMaxOverride(next)
  }

  const handleEnabledChange = (checked: boolean) => {
    setEnabledOverride(checked)
  }

  const handleSave = () => {
    if (!branchId || !branch) return
    upsertMutation.mutate(
      {
        branchId,
        payload: { maxTerminals: localMax, areTerminalsEnabled: localEnabled },
      },
      {
        onSuccess: () => {
          notify.success(t("saved_success"))
          setMaxOverride(null)
          setEnabledOverride(null)
        },
        onError: (error) => {
          notify.error(error instanceof Error ? error.message : t("loading"))
        },
      }
    )
  }

  const handleConfirmDeactivate = () => {
    if (!branchId) return
    deactivateMutation.mutate(branchId, {
      onSuccess: () => {
        notify.success(t("deactivated_success"))
        setConfirmOpen(false)
        setMaxOverride(null)
        setEnabledOverride(null)
        refetchSettings()
        refetchRegisters()
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : t("loading"))
      },
    })
  }

  const handleActivate = () => {
    if (!branchId) return
    activateMutation.mutate(branchId, {
      onSuccess: () => {
        notify.success(t("activated_success"))
        setMaxOverride(null)
        setEnabledOverride(null)
        refetchSettings()
        refetchRegisters()
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : t("loading"))
      },
    })
  }

  const anyMutating =
    upsertMutation.isPending ||
    deactivateMutation.isPending ||
    activateMutation.isPending

  const counterLabel = useMemo(() => {
    const max = settings?.maxTerminals ?? localMax
    return t("counter_label", { current: registers.length, max })
  }, [registers.length, settings?.maxTerminals, localMax, t])

  if (branchError || (!branchLoading && !branch)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business/settings")}>
          <ArrowLeft className="size-4" />
          {t("back_to_branches")}
        </Button>
        <ErrorState
          eyebrow="Branch"
          title={t("branch_not_found")}
          description={t("branch_not_found_desc")}
          action={
            <Button onClick={() => navigate("/business/settings/registers")}>
              <MonitorCog className="size-4" />
              {t("go_registers")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        {t("back_to_branches")}
      </Button>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/business/settings/registers")}
        >
          {t("breadcrumb_branches")}
        </Button>
        <span>/</span>
        <span>{branchLoading ? <Skeleton className="h-4 w-32 inline-block" /> : branchName}</span>
        <span>/</span>
        <span className="text-foreground font-medium">{t("breadcrumb_settings")}</span>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("page_title")}</Badge>
            {branchLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold text-balance text-foreground">
                    {branchName}
                  </h1>
                  <Badge tone={settings?.areTerminalsEnabled ? "success" : "warning"}>
                    {settings?.areTerminalsEnabled
                      ? t("status_active")
                      : t("status_inactive")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t("page_desc")}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  {t("counter_label", { current: registersLoading ? 0 : registers.length, max: settings?.maxTerminals ?? 0 })}
                </p>
                {registersLoading || settingsLoading ? (
                  <Skeleton className="mt-3 h-9 w-16" />
                ) : (
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {registers.length}
                    <span className="ml-2 text-base text-muted-foreground">
                      / {settings?.maxTerminals ?? 0}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("settings_card_title")}</CardTitle>
            <CardDescription>{t("settings_card_desc")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {settingsLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        {t("are_terminals_enabled")}
                      </span>
                      <Badge tone={localEnabled ? "success" : "warning"}>
                        {localEnabled ? t("switch_on") : t("switch_off")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {t("are_terminals_enabled_hint")}
                    </p>
                  </div>
                  <Switch
                    checked={localEnabled}
                    onCheckedChange={handleEnabledChange}
                    disabled={anyMutating}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted scale-150 sm:scale-175"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1 flex-1 max-w-xs">
                    <p className="text-base font-semibold text-foreground">
                      {t("max_terminals")}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {t("max_terminals_hint")}
                    </p>
                    <Input
                      type="number"
                      min={0}
                      value={localMax}
                      onChange={(e) => handleMaxChange(e.target.value)}
                      className="mt-2"
                      disabled={anyMutating}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <div className="flex flex-col gap-3">
                  <p className="text-base font-semibold text-foreground">{t("bulk_actions")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleActivate}
                      disabled={anyMutating || !settings?.areTerminalsEnabled === false}
                    >
                      <Unlock className="size-4" />
                      {t("activate_all")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setConfirmOpen(true)}
                      disabled={anyMutating}
                    >
                      <Lock className="size-4" />
                      {t("deactivate_all")}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={anyMutating || !isDirty}
                >
                  <Save className="size-4" />
                  {t("save_settings")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("registers_list_title")}</CardTitle>
              <CardDescription>{t("registers_list_desc")}</CardDescription>
            </div>
            <Badge tone="neutral">{counterLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {registersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : registers.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Building2 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {t("empty_title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("empty_desc")}</p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => navigate("/business/settings/registers")}
              >
                <MonitorCog className="size-4" />
                {t("go_registers")}
              </Button>
            </Card>
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("column_name")}</TableHead>
                      <TableHead>{t("column_code")}</TableHead>
                      <TableHead>{t("column_status")}</TableHead>
                      <TableHead>{t("column_last_activity")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.code}</TableCell>
                        <TableCell>
                          <Badge tone={statusBadgeTone(r.status)}>
                            {t(statusTextKey(r.status as RegisterStatus))}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.lastActivityAt ? formatDateTime(r.lastActivityAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {registers.map((r) => (
                  <Card
                    key={r.id}
                    className="rounded-[24px] border-border/70 bg-background/45 shadow-none"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.name}</span>
                        <Badge tone={statusBadgeTone(r.status)}>
                          {t(statusTextKey(r.status as RegisterStatus))}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">{t("column_code")}:</span> {r.code}
                        </div>
                        <div>
                          <span className="font-medium">{t("column_last_activity")}:</span>{" "}
                          {r.lastActivityAt ? formatDateTime(r.lastActivityAt) : "—"}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_deactivate_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_deactivate_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
