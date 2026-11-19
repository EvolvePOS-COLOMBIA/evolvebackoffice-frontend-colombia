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
