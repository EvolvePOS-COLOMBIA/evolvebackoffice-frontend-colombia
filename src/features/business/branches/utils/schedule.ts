const DAY_MINUTES = 24 * 60

/** "HH:mm" or "HH:mm:ss" → minutes since midnight. */
export function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/** API time ("HH:mm:ss") → value of an `<input type="time">` ("HH:mm"). */
export function toInputTime(time: string): string {
  return time.slice(0, 5)
}

/** Value of an `<input type="time">` ("HH:mm") → API time ("HH:mm:ss"). */
export function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time
}

export interface ScheduleSummary {
  /** Where the open range starts on a 24 hour track (0-100). */
  startPercent: number
  /** How much of the track the range covers; capped so it never leaves the track. */
  widthPercent: number
  /** Length of the operating day. */
  minutes: number
  /** True when the day closes after midnight. */
  overnight: boolean
}

export function describeSchedule(opening: string, closing: string): ScheduleSummary {
  const start = toMinutes(opening)
  const end = toMinutes(closing)
  const overnight = end < start
  const minutes = end > start ? end - start : DAY_MINUTES - start + end || DAY_MINUTES
  const startPercent = (start / DAY_MINUTES) * 100
  const widthPercent = Math.min(100 - startPercent, (minutes / DAY_MINUTES) * 100)
  return { startPercent, widthPercent, minutes, overnight }
}

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export type DayOfWeek = (typeof WEEK_DAYS)[number]

/** One day of the weekly schedule. Times are API times ("HH:mm:ss"); closed days carry `null`. */
export interface WeekDay {
  dayOfWeek: DayOfWeek
  isOpen: boolean
  openingTime: string | null
  closingTime: string | null
}

/** Schedule as the UI sees it, regardless of which backend contract answered. */
export interface WeekSchedule {
  timeZoneId?: string
  days: WeekDay[]
  /** False while the backend only knows a single opening/closing pair for the whole week. */
  supportsPerDay: boolean
}

export interface LegacySchedulePayload {
  openingTime: string
  closingTime: string
}

export interface ScheduleResponse {
  timeZoneId?: string | null
  days?: Array<Partial<WeekDay>> | null
  openingTime?: string | null
  closingTime?: string | null
}

export type ScheduleErrorKey =
  | "cfg_day_err_incomplete"
  | "cfg_day_err_equal"
  | "cfg_day_err_overlap"
  | "cfg_week_err_none_open"

function normalizeDay(day: Partial<WeekDay> | undefined, dayOfWeek: DayOfWeek): WeekDay {
  const isOpen = Boolean(day?.isOpen)
  return {
    dayOfWeek,
    isOpen,
    openingTime: isOpen ? (day?.openingTime ?? null) : null,
    closingTime: isOpen ? (day?.closingTime ?? null) : null,
  }
}

/** Accepts the per-day contract or the legacy single pair, and always returns the seven days Monday..Sunday. */
export function parseScheduleResponse(raw: ScheduleResponse): WeekSchedule {
  const timeZoneId = raw.timeZoneId ?? undefined
  if (Array.isArray(raw.days)) {
    const byDay = new Map(raw.days.map((day) => [day.dayOfWeek, day]))
    return {
      timeZoneId,
      supportsPerDay: true,
      days: WEEK_DAYS.map((dayOfWeek) => normalizeDay(byDay.get(dayOfWeek), dayOfWeek)),
    }
  }
  return {
    timeZoneId,
    supportsPerDay: false,
    days: WEEK_DAYS.map((dayOfWeek) => ({
      dayOfWeek,
      isOpen: true,
      openingTime: raw.openingTime ?? null,
      closingTime: raw.closingTime ?? null,
    })),
  }
}

/** The legacy backend can only store one pair: every day open with exactly the same hours. */
export function canSaveLegacy(days: WeekDay[]): boolean {
  const [first] = days
  if (!first?.openingTime || !first.closingTime) return false
  return days.every(
    (day) => day.isOpen && day.openingTime === first.openingTime && day.closingTime === first.closingTime
  )
}

/** Body for the legacy PUT. Call it only when `canSaveLegacy(days)` is true. */
export function buildLegacyPayload(days: WeekDay[]): LegacySchedulePayload {
  return { openingTime: days[0]?.openingTime ?? "", closingTime: days[0]?.closingTime ?? "" }
}

/** Length and overnight flag of an open day; null while the day is closed or its times are not usable. */
export function describeDay(day: WeekDay): { overnight: boolean; minutes: number } | null {
  if (!day.isOpen || !day.openingTime || !day.closingTime) return null
  const start = toMinutes(day.openingTime)
  const end = toMinutes(day.closingTime)
  if (start === end) return null
  const overnight = end < start
  return { overnight, minutes: overnight ? DAY_MINUTES - start + end : end - start }
}

/** Validation message key of every day (null when valid). Overnight overlap checks the next day; Sunday wraps to Monday. */
export function dayErrors(days: WeekDay[]): Array<ScheduleErrorKey | null> {
  return days.map((day, index) => {
    if (!day.isOpen) return null
    if (!day.openingTime || !day.closingTime) return "cfg_day_err_incomplete"
    if (toMinutes(day.openingTime) === toMinutes(day.closingTime)) return "cfg_day_err_equal"
    const next = days[(index + 1) % days.length]
    if (describeDay(day)?.overnight && next?.isOpen && next.openingTime) {
      if (toMinutes(day.closingTime) > toMinutes(next.openingTime)) return "cfg_day_err_overlap"
    }
    return null
  })
}

/** Week-level rule: at least one open day. */
export function weekError(days: WeekDay[]): ScheduleErrorKey | null {
  return days.some((day) => day.isOpen) ? null : "cfg_week_err_none_open"
}

/** Monday 00:00 of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

function dateAt(weekStart: Date, dayOffset: number, time: string): Date {
  const minutes = toMinutes(time)
  return new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + dayOffset,
    Math.floor(minutes / 60),
    minutes % 60
  )
}

const hasHours = (day: WeekDay | undefined): day is WeekDay => Boolean(day?.isOpen && day.openingTime)

export interface ClosingWindow {
  start: Date
  end: Date
  /** Day whose opening ends the window (the same day one week later when it is the only open day). */
  nextIndex: number
}

/**
 * Closing window of a day: from its opening to the opening of the next open day. A closed day has none;
 * `rollsIntoIndex` is the last open day before it, whose window absorbs its orders.
 */
export function closingWindow(
  days: WeekDay[],
  dayIndex: number,
  weekStart: Date
): { window: ClosingWindow | null; rollsIntoIndex: number | null } {
  const count = days.length
  const day = days[dayIndex]
  if (!hasHours(day)) {
    for (let step = 1; step <= count; step++) {
      const candidate = (((dayIndex - step) % count) + count) % count
      if (hasHours(days[candidate])) return { window: null, rollsIntoIndex: candidate }
    }
    return { window: null, rollsIntoIndex: null }
  }
  let step = 1
  while (step < count && !hasHours(days[(dayIndex + step) % count])) step++
  const nextIndex = (dayIndex + step) % count
  return {
    window: {
      start: dateAt(weekStart, dayIndex, day.openingTime!),
      end: dateAt(weekStart, dayIndex + step, days[nextIndex].openingTime!),
      nextIndex,
    },
    rollsIntoIndex: null,
  }
}
