import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, Lock, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranchSchedule, useUpdateBranchSchedule } from "@/features/business/branches/hooks/use-branch-schedule"
import { describeSchedule, toApiTime, toInputTime, toMinutes } from "@/features/business/branches/utils/schedule"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import type { ConfigSectionId } from "./config-sections"
import { SaveBar, SectionShell, SettingRow, SettingsGroup } from "./settings-primitives"

const TRACK_TICKS = ["00:00", "06:00", "12:00", "18:00", "24:00"]

/** Opening of today at the given "HH:mm", and the same hour tomorrow: the closing window runs between them. */
function closingWindow(opening: string) {
  const minutes = toMinutes(opening)
  const start = new Date()
  start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

interface ScheduleSectionProps {
  branchId: string
  onDirtyChange?: (id: ConfigSectionId, dirty: boolean) => void
}

/** Opening and closing hour. They define the window of the orders closing, shown here as a 24 hour track. */
export function ScheduleSection({ branchId, onDirtyChange }: ScheduleSectionProps) {
  const { t } = useTranslation("business-branches")
  const navigate = useNavigate()
  const { formatDateTime } = useLocaleFormat()
  const { data: schedule, isLoading } = useBranchSchedule(branchId)
  const updateSchedule = useUpdateBranchSchedule()
  const [draft, setDraft] = useState<{ opening?: string; closing?: string }>({})

  const savedOpening = schedule ? toInputTime(schedule.openingTime) : ""
  const savedClosing = schedule ? toInputTime(schedule.closingTime) : ""
  const opening = draft.opening ?? savedOpening
  const closing = draft.closing ?? savedClosing
  const isDirty = Boolean(schedule) && (opening !== savedOpening || closing !== savedClosing)
  const isValid = opening !== "" && closing !== ""
  const summary = isValid ? describeSchedule(opening, closing) : null
  const windowRange = isValid ? closingWindow(opening) : null

  useEffect(() => {
    onDirtyChange?.("schedule", isDirty)
  }, [isDirty, onDirtyChange])

  const handleSave = () => {
    if (!isValid) return
    updateSchedule.mutate(
      { branchId, schedule: { openingTime: toApiTime(opening), closingTime: toApiTime(closing) } },
      {
        onSuccess: () => {
          setDraft({})
          notify.success(t("cfg_schedule_saved"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("cfg_schedule_error"))),
      }
    )
  }

  return (
    <SectionShell
      icon={Clock}
      title={t("section_schedule")}
      description={t("section_schedule_desc")}
      footer={
        <SaveBar
          visible={isDirty}
          isPending={updateSchedule.isPending}
          onSave={handleSave}
          onDiscard={() => setDraft({})}
        />
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid items-start gap-4 @xl:grid-cols-2">
            <SettingsGroup icon={Clock} title={t("cfg_schedule_group")}>
              <SettingRow title={t("cfg_opening")} description={t("cfg_opening_hint")}>
                <Input
                  type="time"
                  value={opening}
                  aria-label={t("cfg_opening")}
                  onChange={(event) => setDraft((current) => ({ ...current, opening: event.target.value }))}
                  className="w-36 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </SettingRow>
              <SettingRow title={t("cfg_closing")} description={t("cfg_closing_hint")}>
                <Input
                  type="time"
                  value={closing}
                  aria-label={t("cfg_closing")}
                  onChange={(event) => setDraft((current) => ({ ...current, closing: event.target.value }))}
                  className="w-36 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </SettingRow>
            </SettingsGroup>

            <SettingsGroup icon={Zap} title={t("cfg_preview")} aside={<Badge tone="info">{t("cfg_live")}</Badge>}>
              <div className="space-y-3 p-4">
                <div
                  role="img"
                  aria-label={`${opening} – ${closing}`}
                  className="relative h-3 overflow-hidden rounded-full bg-muted"
                >
                  {summary ? (
                    <div
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_14px_var(--primary)] transition-[left,width] duration-300"
                      style={{ left: `${summary.startPercent}%`, width: `${summary.widthPercent}%` }}
                    />
                  ) : null}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  {TRACK_TICKS.map((tick) => (
                    <span key={tick}>{tick}</span>
                  ))}
                </div>
                {summary ? (
                  <p className="text-sm font-semibold tabular-nums">
                    {t("cfg_open_for", { hours: Math.floor(summary.minutes / 60), minutes: summary.minutes % 60 })}
                  </p>
                ) : null}
                {windowRange ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("cfg_window_line", {
                      start: formatDateTime(windowRange.start),
                      end: formatDateTime(windowRange.end),
                    })}
                  </p>
                ) : null}
                {summary?.overnight ? <p className="text-xs text-muted-foreground">{t("cfg_overnight")}</p> : null}
              </div>
            </SettingsGroup>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm">
            <span>
              <strong className="font-semibold text-amber-600 dark:text-amber-300">{t("cfg_window_title")}</strong>
              {" · "}
              {t("cfg_window_note")}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate("/business/orders/closing")}>
              <Lock className="size-4" />
              {t("cfg_go_closing")}
            </Button>
          </div>
        </>
      )}
    </SectionShell>
  )
}
