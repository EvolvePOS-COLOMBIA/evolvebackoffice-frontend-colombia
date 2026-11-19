import { Minus, Monitor, Plus, Settings2 } from "lucide-react"

import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  useActivateBranchTerminals,
  useBranchRegisters,
  useBranchTerminalSettings,
  useDeactivateBranchTerminals,
  useUpsertBranchTerminalSettings,
} from "@/features/business/branches/hooks/use-branch-terminals"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { SectionShell, SettingRow, SettingsGroup } from "./settings-primitives"

const MIN_TERMINALS = 1
const MAX_TERMINALS = 50

const STATUS_LABEL_KEY: Record<string, string> = {
  Active: "serials_status_active",
  Activated: "serials_status_activated",
  Unassigned: "serials_status_unassigned",
  Decommissioned: "serials_status_decommissioned",
  Maintenance: "serials_status_maintenance",
  Locked: "serials_status_locked",
  Inactive: "terminals_status_inactive",
}

function statusTone(status: string): BadgeTone {
  if (status === "Active") return "success"
  if (status === "Locked") return "danger"
  return "warning"
}

/** Terminal limit and lock for the branch, plus the registers (POS boxes) already assigned to it. */
export function TerminalsSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("business-branches")
  const { data: settings, isLoading: settingsLoading } = useBranchTerminalSettings(branchId)
  const { data: registers = [], isLoading: registersLoading } = useBranchRegisters(branchId)
  const upsert = useUpsertBranchTerminalSettings()
  const activate = useActivateBranchTerminals()
  const deactivate = useDeactivateBranchTerminals()

  const enabled = settings?.areTerminalsEnabled ?? true
  const max = settings?.maxTerminals ?? 3
  const used = registers.length
  const isMutating = upsert.isPending || activate.isPending || deactivate.isPending

  const toggleEnabled = (checked: boolean) => {
    const mutation = checked ? activate : deactivate
    mutation.mutate(branchId, {
      onSuccess: () => notify.success(checked ? t("terminals_activated_success") : t("terminals_deactivated_success")),
      onError: (error) => notify.error(getApiErrorMessage(error, t("error_loading"))),
    })
  }

  const changeMax = (delta: number) => {
    const next = Math.min(MAX_TERMINALS, Math.max(MIN_TERMINALS, max + delta))
    if (next === max) return
    upsert.mutate(
      { branchId, payload: { maxTerminals: next, areTerminalsEnabled: enabled } },
      {
        onSuccess: () => notify.success(t("saved_success")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("error_loading"))),
      }
    )
  }

  return (
    <SectionShell icon={Monitor} title={t("section_terminals")} description={t("section_terminals_desc")}>
      <div className="grid items-start gap-4 @2xl:grid-cols-2">
        <SettingsGroup icon={Settings2} title={t("cfg_terminals_settings")}>
          {settingsLoading ? (
            <Skeleton className="m-4 h-24 rounded-xl" />
          ) : (
            <>
              <SettingRow title={t("are_terminals_enabled")} description={t("are_terminals_enabled_hint")}>
                <Switch
                  glow
                  checked={enabled}
                  disabled={isMutating}
                  onCheckedChange={toggleEnabled}
                  aria-label={t("are_terminals_enabled")}
                />
              </SettingRow>
              <SettingRow title={t("max_terminals")} description={t("max_terminals_hint")}>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("cfg_fewer")}
                    disabled={isMutating || max <= MIN_TERMINALS}
                    onClick={() => changeMax(-1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <output aria-label={t("max_terminals")} className="min-w-9 text-center font-semibold tabular-nums">
                    {max}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("cfg_more")}
                    disabled={isMutating || max >= MAX_TERMINALS}
                    onClick={() => changeMax(1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </SettingRow>
            </>
          )}
        </SettingsGroup>

        <SettingsGroup
          icon={Monitor}
          title={t("cfg_registers_group")}
          aside={
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("cfg_registers_usage", { used, max })}
            </span>
          }
        >
          {registersLoading ? (
            <Skeleton className="m-4 h-24 rounded-xl" />
          ) : registers.length === 0 ? (
            <div className="space-y-1 p-6 text-center text-sm text-muted-foreground">
              <p>{t("terminals_empty_title")}</p>
              <p className="text-xs">{t("terminals_empty_desc")}</p>
            </div>
          ) : (
            <>
              <ul>
                {registers.map((register) => (
                  <li
                    key={register.id}
                    className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-primary/5"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-mono font-semibold">
                      <Monitor className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{register.serialCode ?? register.code}</span>
                    </span>
                    {register.status === "Active" ? (
                      <Badge live tone="success">
                        {STATUS_LABEL_KEY[register.status] ? t(STATUS_LABEL_KEY[register.status]) : register.status}
                      </Badge>
                    ) : (
                      <Badge tone={statusTone(register.status)}>
                        {STATUS_LABEL_KEY[register.status] ? t(STATUS_LABEL_KEY[register.status]) : register.status}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mx-4 mt-1 mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%` }}
                />
              </div>
            </>
          )}
        </SettingsGroup>
      </div>
    </SectionShell>
  )
}
