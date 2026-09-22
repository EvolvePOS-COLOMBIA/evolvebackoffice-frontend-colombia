import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Building2, MonitorCog, Settings } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getBranchById } from "@/features/business/branches/services/branches.service"
import {
  useBranchRegisters,
  useBranchTerminalSettings,
  useDeactivateBranchTerminals,
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

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useBranchTerminalSettings(branchId)

  const { data: registers = [], isLoading: registersLoading, refetch: refetchRegisters } = useBranchRegisters(branchId)

  const deactivateMutation = useDeactivateBranchTerminals()

  const localMax = useMemo(() => maxOverride ?? settings?.maxTerminals ?? 3, [maxOverride, settings?.maxTerminals])
  const availableTerminalSlots = Math.max(0, localMax - registers.length)

  const branchName = branch?.name ?? ""

  const handleConfirmDeactivate = () => {
    if (!branchId) return
    deactivateMutation.mutate(branchId, {
      onSuccess: () => {
        notify.success(t("deactivated_success"))
        setConfirmOpen(false)
        setMaxOverride(null)
        refetchSettings()
        refetchRegisters()
      },
      onError: (error) => {
        notify.error(error instanceof Error ? error.message : t("loading"))
      },
    })
  }

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
            <Button onClick={() => navigate("/business/settings/branches")}>
              <MonitorCog className="size-4" />
              {t("go_registers")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          {t("back_to_branches")}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/business/branches/${branchId}/config`)}>
          <Settings className="size-4" />
          {t("breadcrumb_config")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/business/settings/branches")}
        >
          {t("breadcrumb_branches")}
        </Button>
        <span>/</span>
        <span>{branchLoading ? <Skeleton className="inline-block h-4 w-32" /> : branchName}</span>
        <span>/</span>
        <span className="font-medium text-foreground">{t("breadcrumb_settings")}</span>
      </div>

      <Card className="relative overflow-hidden border-border/80 bg-card/70 shadow-none">
        <div className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full border border-primary/10 bg-primary/[0.035]" />
        <CardContent className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary" className="w-fit text-[10px] tracking-[0.18em] uppercase">
              {t("page_title")}
            </Badge>
            {branchLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
                  <Building2 className="size-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground">{branchName}</h1>
                    <Badge tone={settings?.areTerminalsEnabled ? "success" : "warning"}>
                      {settings?.areTerminalsEnabled ? t("status_active") : t("status_inactive")}
                    </Badge>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t("page_desc")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TerminalStat label={t("in_use")} value={registers.length} loading={registersLoading || settingsLoading} />
            <TerminalStat
              label={t("available_slots")}
              value={availableTerminalSlots}
              loading={registersLoading || settingsLoading}
              muted
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/70 shadow-none">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("registers_list_title")}</CardTitle>
              <CardDescription>{t("registers_list_desc")}</CardDescription>
            </div>
            <Badge tone="neutral">{counterLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-5">
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
              <h2 className="mt-4 text-lg font-semibold text-foreground">{t("empty_title")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("empty_desc")}</p>
              <Button variant="outline" className="mt-5" onClick={() => navigate("/business/settings/registers")}>
                <MonitorCog className="size-4" />
                {t("go_registers")}
              </Button>
            </Card>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border/70 xl:block">
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
                      <TableRow key={r.id} className="transition-colors hover:bg-muted/40">
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.code}</TableCell>
                        <TableCell>
                          <Badge tone={statusBadgeTone(r.status)}>{t(statusTextKey(r.status as RegisterStatus))}</Badge>
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
                    className="rounded-[24px] border-border/70 bg-background/45 shadow-none transition-colors hover:border-primary/25"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.name}</span>
                        <Badge tone={statusBadgeTone(r.status)}>{t(statusTextKey(r.status as RegisterStatus))}</Badge>
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

function TerminalStat({
  label,
  value,
  loading,
  muted = false,
}: {
  label: string
  value: number
  loading: boolean
  muted?: boolean
}) {
  return (
    <Card className="max-h-min rounded-2xl border-border/70 bg-background/45 shadow-none">
      <CardContent className="p-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-10" />
        ) : (
          <p
            className={
              "mt-2 text-2xl font-semibold tracking-tight " + (muted ? "text-muted-foreground" : "text-foreground")
            }
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
