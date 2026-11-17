import type { Period, SalesByPeriodPoint } from "../mock/dashboard-data"

/** Abbreviated day labels (es/en) mapped to day-of-week index (0 = Sunday). */
export const DAY_INDEX: Record<string, number> = {
  Lun: 1,
  Mar: 2,
  Mié: 3,
  Jue: 4,
  Vie: 5,
  Sáb: 6,
  Dom: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 0,
}

/** Canonical label per day of the week, Sunday first (the dashboard week runs Sunday–Saturday). */
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const empty = (label: string): SalesByPeriodPoint => ({ label, sales: 0, transactions: 0 })

/**
 * The sales-by-period endpoint only returns the buckets that have sales (a week with one sale
 * comes back as a single point). An area chart cannot draw a line or a fill with fewer than two
 * points, so the empty days are filled with zero here.
 *
 * - week: the 7 days, Sunday first.
 * - month: every day from the 1st to today (or to the last day the API sent, if later).
 * - day: untouched; the API already returns the 24 hours.
 *
 * If any label is not recognized the series is returned as it came, so no data is ever dropped.
 */
export function fillSalesBuckets(
  points: SalesByPeriodPoint[],
  period: Period,
  now: Date = new Date()
): SalesByPeriodPoint[] {
  if (period === "week") {
    const byDay = new Map<number, SalesByPeriodPoint>()
    for (const point of points) {
      const index = DAY_INDEX[point.label]
      if (index === undefined) return points
      byDay.set(index, point)
    }
    return WEEK_LABELS.map((label, index) => byDay.get(index) ?? empty(label))
  }

  if (period === "month") {
    const byDay = new Map<number, SalesByPeriodPoint>()
    for (const point of points) {
      const day = Number(point.label)
      if (!Number.isInteger(day) || day < 1) return points
      byDay.set(day, point)
    }
    const lastDay = Math.max(now.getDate(), ...byDay.keys())
    return Array.from({ length: lastDay }, (_, index) => byDay.get(index + 1) ?? empty(String(index + 1)))
  }

  return points
}
