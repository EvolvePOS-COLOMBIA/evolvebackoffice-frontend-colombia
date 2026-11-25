import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, Clock, Globe, Lock, TriangleAlert, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useBranchSchedule, useUpdateBranchSchedule } from "@/features/business/branches/hooks/use-branch-schedule"
import {
  canSaveLegacy,
  closingWindow,
  dayErrors,
  describeDay,
  startOfWeek,
  toApiTime,
  toInputTime,
  toMinutes,
  weekError,
  type WeekDay,
} from "@/features/business/branches/utils/schedule"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import type { ConfigSectionId } from "./config-sections"
import { SaveBar, SectionShell, SettingsGroup } from "./settings-primitives"

const TRACK_TICKS = ["00", "06", "12", "18", "24"]
const DAY_MINUTES = 1440
const DEFAULT_HOURS = { openingTime: "08:00:00", closingTime: "22:00:00" }
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

const STRIPES_SPILL =
  "repeating-linear-gradient(135deg, var(--primary) 0 5px, color-mix(in oklab, var(--primary) 55%, transparent) 5px 10px)"
const STRIPES_CLOSED =
  "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted-foreground) 35%, transparent) 6px 7px)"

const TIME_INPUT_CLASS =
  "h-9 min-w-0 flex-1 @2xl:flex-none appearance-none tabular-nums @2xl:w-[7.5rem] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"

const sameWeek = (a: WeekDay[], b: WeekDay[]) => JSON.stringify(a) === JSON.stringify(b)

interface ScheduleSectionProps {
  branchId: string
  /** Fallback while the schedule response carries no time zone. */
  timeZoneId?: string
  onDirtyChange?: (id: ConfigSectionId, dirty: boolean) => void
}

/** Weekly schedule: one opening/closing per day. It defines the window of the orders closing. */
export function ScheduleSection({ branchId, timeZoneId, onDirtyChange }: ScheduleSectionProps) {
  const { t } = useTranslation("business-branches")
  const navigate = useNavigate()
  const { formatDate, formatDateTime } = useLocaleFormat()
  const { data: schedule, isLoading } = useBranchSchedule(branchId)
  const updateSchedule = useUpdateBranchSchedule()
  const [draft, setDraft] = useState<WeekDay[] | null>(null)
  const [now] = useState(() => new Date())
  const todayIndex = (now.getDay() + 6) % 7
  const weekStart = useMemo(() => startOfWeek(now), [now])
  const [selected, setSelected] = useState(todayIndex)

  const days = useMemo(() => draft ?? schedule?.days ?? [], [draft, schedule])
  const supportsPerDay = schedule?.supportsPerDay ?? true
  const errors = useMemo(() => dayErrors(days), [days])
  const weekIssue = days.length ? weekError(days) : null
  const errorCount = errors.filter(Boolean).length + (weekIssue ? 1 : 0)
  const isDirty = Boolean(schedule && draft && !sameWeek(draft, schedule.days))
  const legacyBlocked = Boolean(schedule) && !supportsPerDay && !canSaveLegacy(days)
  const openCount = days.filter((day) => day.isOpen).length
  const zone = schedule?.timeZoneId ?? timeZoneId

  useEffect(() => {
    onDirtyChange?.("schedule", isDirty)
  }, [isDirty, onDirtyChange])

  const dayName = (index: number) => t(`cfg_day_${DAY_KEYS[index]}`)
  const dayShort = (index: number) => t(`cfg_day_${DAY_KEYS[index]}_short`)
  const dateOf = (index: number) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    return date
  }
  const formatDuration = (minutes: number) =>
    minutes % 60 === 0
      ? t("cfg_day_duration", { hours: minutes / 60 })
      : t("cfg_day_duration_min", { hours: Math.floor(minutes / 60), minutes: minutes % 60 })

  const update = (next: WeekDay[]) => setDraft(next)
  const patchDay = (index: number, patch: Partial<WeekDay>) =>
    update(days.map((day, i) => (i === index ? { ...day, ...patch } : day)))

  const toggleDay = (index: number, isOpen: boolean) => {
    setSelected(index)
    if (!isOpen) return patchDay(index, { isOpen: false, openingTime: null, closingTime: null })
    const reference = days.find((day) => day.isOpen && day.openingTime && day.closingTime)
    patchDay(index, {
      isOpen: true,
      openingTime: reference?.openingTime ?? DEFAULT_HOURS.openingTime,
      closingTime: reference?.closingTime ?? DEFAULT_HOURS.closingTime,
    })
  }

  const copyMondayToWeekdays = () => {
    const [monday] = days
    update(days.map((day, i) => (i >= 1 && i <= 4 ? { ...day, ...hoursOf(monday) } : day)))
  }

  const sameHoursAllWeek = () => {
    const source = days[selected]?.isOpen ? days[selected] : days.find((day) => day.isOpen)
    const hours = source ? hoursOf(source) : { isOpen: true, ...DEFAULT_HOURS }
    update(days.map((day) => ({ ...day, ...hours })))
  }

  const handleSave = () => {
    if (!isDirty || errorCount > 0 || legacyBlocked) return
    updateSchedule.mutate(
      { branchId, days, supportsPerDay },
      {
        onSuccess: () => {
          setDraft(null)
          notify.success(t("cfg_schedule_saved"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("cfg_schedule_error"))),
      }
    )
  }

  const errorMessage = (index: number) => {
    const key = errors[index]
    if (!key) return null
    const next = days[(index + 1) % days.length]
    return t(key, {
      closing: toInputTime(days[index].closingTime ?? ""),
      opening: toInputTime(next?.openingTime ?? ""),
    })
  }

  const selectedDay = days[selected]
  const selectedSummary = selectedDay ? describeDay(selectedDay) : null
  const windowInfo = days.length ? closingWindow(days, selected, weekStart) : null

  const barMessage = weekIssue
    ? t(weekIssue)
    : errorCount > 0
      ? t("cfg_schedule_errors", { count: errorCount })
      : legacyBlocked
        ? t("cfg_schedule_legacy_short")
        : undefined

  return (
    <SectionShell
      icon={Clock}
      title={t("section_schedule")}
      description={t("section_schedule_desc")}
      status={
        zone ? (
          <span
            title={t("cfg_schedule_time_zone")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground"
          >
            <Globe className="size-3.5" aria-hidden />
            <span className="sr-only">{t("cfg_schedule_time_zone")}: </span>
            {zone}
          </span>
        ) : null
      }
      footer={
        <SaveBar
          visible={isDirty}
          isPending={updateSchedule.isPending}
          saveDisabled={errorCount > 0 || legacyBlocked}
          message={barMessage}
          messageTone={errorCount > 0 ? "error" : "default"}
          onSave={handleSave}
          onDiscard={() => setDraft(null)}
        />
      }
    >
      {isLoading || !schedule ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid items-start gap-4 @5xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <SettingsGroup
              icon={CalendarDays}
              title={t("cfg_schedule_week")}
              aside={<Badge tone="neutral">{t("cfg_schedule_open_count", { count: openCount })}</Badge>}
            >
              <div
                role="group"
                aria-label={t("cfg_schedule_shortcuts")}
                className="flex flex-wrap gap-2 border-b border-border/70 p-3"
              >
                <Button type="button" variant="outline" size="sm" onClick={copyMondayToWeekdays}>
                  {t("cfg_copy_monday_weekdays")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={sameHoursAllWeek}>
                  {t("cfg_same_all_week")}
                </Button>
              </div>

              <div className="@container">
                {days.map((day, index) => {
                  const summary = describeDay(day)
                  const message = errorMessage(index)
                  const isSelected = index === selected
                  return (
                    <div
                      key={day.dayOfWeek}
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => setSelected(index)}
                      onFocus={() => setSelected(index)}
                      className={cn(
                        "grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-b border-border/70 px-4 py-3 last:border-b-0 @2xl:grid-cols-[7rem_minmax(0,1fr)_auto]",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <div className="col-start-1 row-start-1 grid min-w-0 leading-tight">
                        <span className="text-sm font-semibold">{dayName(index)}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(dateOf(index))}
                          {index === todayIndex ? (
                            <span className="font-semibold text-primary"> · {t("cfg_day_today")}</span>
                          ) : null}
                        </span>
                      </div>
                      {day.isOpen ? (
                        <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 @max-[22rem]:flex-wrap @2xl:col-span-1 @2xl:col-start-2 @2xl:row-start-1">
                          <div className="flex min-w-0 flex-1 items-center gap-2 @max-[22rem]:basis-full @2xl:flex-none">
                            <Input
                              type="time"
                              value={day.openingTime ? toInputTime(day.openingTime) : ""}
                              aria-label={t("cfg_day_opening_label", { day: dayName(index) })}
                              aria-invalid={Boolean(message)}
                              onChange={(event) =>
                                patchDay(index, {
                                  openingTime: event.target.value ? toApiTime(event.target.value) : null,
                                })
                              }
                              className={cn(TIME_INPUT_CLASS, message && "border-rose-400")}
                            />
                            <span aria-hidden className="text-muted-foreground">
                              →
                            </span>
                            <Input
                              type="time"
                              value={day.closingTime ? toInputTime(day.closingTime) : ""}
                              aria-label={t("cfg_day_closing_label", { day: dayName(index) })}
                              aria-invalid={Boolean(message)}
                              onChange={(event) =>
                                patchDay(index, {
                                  closingTime: event.target.value ? toApiTime(event.target.value) : null,
                                })
                              }
                              className={cn(TIME_INPUT_CLASS, message && "border-rose-400")}
                            />
                          </div>
                          {summary ? (
                            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                              {summary.overnight ? <Badge tone="info">{t("cfg_day_overnight_badge")}</Badge> : null}
                              <Badge tone="neutral">{formatDuration(summary.minutes)}</Badge>
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="col-span-2 row-start-2 text-sm text-muted-foreground @2xl:col-span-1 @2xl:col-start-2 @2xl:row-start-1">
                          {t("cfg_day_closed_note")}
                        </p>
                      )}
                      <label className="col-start-2 row-start-1 flex items-center justify-end gap-2 text-xs text-muted-foreground @2xl:col-start-3">
                        <span aria-hidden>{day.isOpen ? t("cfg_day_state_open") : t("cfg_day_state_closed")}</span>
                        <Switch
                          checked={day.isOpen}
                          onCheckedChange={(checked) => toggleDay(index, checked)}
                          aria-label={t("cfg_day_open_toggle", { day: dayName(index) })}
                        />
                      </label>
                      {message ? (
                        <p role="alert" className="col-span-full -mt-1 text-xs text-rose-500 dark:text-rose-300">
                          {message}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </SettingsGroup>

            <SettingsGroup icon={Zap} title={t("cfg_week_preview")} aside={<Badge tone="info">{t("cfg_live")}</Badge>}>
              <div className="space-y-2 px-4 pt-4 pb-2" role="group" aria-label={t("cfg_week_timeline")}>
                <div className="grid grid-cols-[2.5rem_1fr] gap-2.5 text-[11px] text-muted-foreground tabular-nums">
                  <span />
                  <div className="flex justify-between" aria-hidden>
                    {TRACK_TICKS.map((tick) => (
                      <span key={tick}>{tick}</span>
                    ))}
                  </div>
                </div>
                {days.map((day, index) => {
                  const summary = describeDay(day)
                  const previous = days[(index + days.length - 1) % days.length]
                  const spill = previous ? describeDay(previous) : null
                  const spillMinutes = spill?.overnight && previous.closingTime ? toMinutes(previous.closingTime) : 0
                  const start = day.openingTime ? toMinutes(day.openingTime) : 0
                  const end = summary?.overnight ? DAY_MINUTES : day.closingTime ? toMinutes(day.closingTime) : 0
                  const label = t("cfg_lane_label", {
                    day: dayName(index),
                    summary: summary
                      ? `${toInputTime(day.openingTime ?? "")} – ${toInputTime(day.closingTime ?? "")}`
                      : t("cfg_lane_closed"),
                  })
                  return (
                    <button
                      key={day.dayOfWeek}
                      type="button"
                      onClick={() => setSelected(index)}
                      aria-pressed={index === selected}
                      aria-label={label}
                      className="grid w-full grid-cols-[2.5rem_1fr] items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold text-muted-foreground",
                          index === selected && "text-primary"
                        )}
                      >
                        {dayShort(index)}
                      </span>
                      <span
                        className={cn(
                          "relative block h-[18px] overflow-hidden rounded-md bg-muted",
                          index === selected && "ring-1 ring-primary"
                        )}
                      >
                        {spillMinutes > 0 ? (
                          <span
                            className="absolute inset-y-0 left-0 rounded-md"
                            style={{ width: `${(spillMinutes / DAY_MINUTES) * 100}%`, backgroundImage: STRIPES_SPILL }}
                          />
                        ) : null}
                        {!day.isOpen ? (
                          <span className="absolute inset-0 rounded-md" style={{ backgroundImage: STRIPES_CLOSED }} />
                        ) : summary ? (
                          <span
                            className="absolute inset-y-0 rounded-md bg-primary"
                            style={{
                              left: `${(start / DAY_MINUTES) * 100}%`,
                              width: `${((end - start) / DAY_MINUTES) * 100}%`,
                            }}
                          />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-1 pb-3 text-xs text-muted-foreground">
                <LegendItem label={t("cfg_legend_open")} className="bg-primary" />
                <LegendItem label={t("cfg_legend_spill")} style={{ backgroundImage: STRIPES_SPILL }} />
                <LegendItem
                  label={t("cfg_legend_closed")}
                  className="border border-border/70 bg-muted"
                  style={{ backgroundImage: STRIPES_CLOSED }}
                />
              </div>

              {selectedDay ? (
                <div
                  aria-live="polite"
                  className="mx-4 mb-4 grid gap-1.5 rounded-xl border border-border/70 bg-background/60 p-4"
                >
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {t("cfg_window_for_day", { day: dayName(selected) })}
                  </span>
                  {windowInfo?.window && selectedSummary ? (
                    <>
                      <strong className="text-sm">
                        {t(selectedSummary.overnight ? "cfg_window_shift_overnight" : "cfg_window_shift", {
                          duration: formatDuration(selectedSummary.minutes),
                        })}
                      </strong>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {t("cfg_window_range", {
                          start: `${dayShort(selected)} ${formatDateTime(windowInfo.window.start)}`,
                          end: `${dayShort(windowInfo.window.nextIndex)} ${formatDateTime(windowInfo.window.end)}`,
                          hours: Math.round(
                            (windowInfo.window.end.getTime() - windowInfo.window.start.getTime()) / 3_600_000
                          ),
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      <strong className="text-sm">{t("cfg_window_closed_title")}</strong>
                      <span className="text-xs text-muted-foreground">
                        {windowInfo?.rollsIntoIndex != null
                          ? t("cfg_window_closed_rolls", { day: dayName(windowInfo.rollsIntoIndex).toLowerCase() })
                          : t("cfg_window_none_open")}
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </SettingsGroup>
          </div>

          {legacyBlocked ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
              <span>{t("cfg_schedule_legacy_notice")}</span>
            </div>
          ) : null}

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

function hoursOf(day: WeekDay | undefined) {
  return {
    isOpen: day?.isOpen ?? true,
    openingTime: day?.openingTime ?? null,
    closingTime: day?.closingTime ?? null,
  }
}

function LegendItem({ label, className, style }: { label: string; className?: string; style?: CSSProperties }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className={cn("inline-block h-2.5 w-[18px] rounded-[3px]", className)} style={style} />
      {label}
    </span>
  )
}
