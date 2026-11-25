import { describe, expect, it } from "vitest"

import {
  buildLegacyPayload,
  canSaveLegacy,
  closingWindow,
  dayErrors,
  describeDay,
  parseScheduleResponse,
  startOfWeek,
  weekError,
  WEEK_DAYS,
  type WeekDay,
} from "../schedule"

const open = (opening: string, closing: string) => ({ isOpen: true, openingTime: opening, closingTime: closing })
const closed = { isOpen: false, openingTime: null, closingTime: null }

function week(spec: Array<{ isOpen: boolean; openingTime: string | null; closingTime: string | null }>): WeekDay[] {
  return spec.map((day, index) => ({ dayOfWeek: WEEK_DAYS[index], ...day }))
}

const allClosed = () => week(Array.from({ length: 7 }, () => closed))
const uniform = (opening = "08:00:00", closing = "22:00:00") =>
  week(Array.from({ length: 7 }, () => open(opening, closing)))

describe("parseScheduleResponse", () => {
  it("orders the days Monday to Sunday when the backend supports per-day hours", () => {
    const shuffled = [...uniform()].reverse()
    const result = parseScheduleResponse({ timeZoneId: "America/Bogota", days: shuffled })
    expect(result.supportsPerDay).toBe(true)
    expect(result.timeZoneId).toBe("America/Bogota")
    expect(result.days.map((d) => d.dayOfWeek)).toEqual([...WEEK_DAYS])
  })

  it("fills in missing days as closed", () => {
    const result = parseScheduleResponse({ days: [uniform()[2]] })
    expect(result.days).toHaveLength(7)
    expect(result.days[2].isOpen).toBe(true)
    expect(result.days[0]).toMatchObject({ dayOfWeek: "Monday", isOpen: false, openingTime: null, closingTime: null })
  })

  it("nulls the times of closed days", () => {
    const result = parseScheduleResponse({
      days: [{ dayOfWeek: "Monday", isOpen: false, openingTime: "08:00:00", closingTime: "20:00:00" }],
    })
    expect(result.days[0]).toMatchObject({ isOpen: false, openingTime: null, closingTime: null })
  })

  it("expands the legacy shape to seven open days", () => {
    const result = parseScheduleResponse({ openingTime: "07:00:00", closingTime: "23:00:00" })
    expect(result.supportsPerDay).toBe(false)
    expect(result.days).toHaveLength(7)
    expect(result.days.every((d) => d.isOpen && d.openingTime === "07:00:00" && d.closingTime === "23:00:00")).toBe(
      true
    )
  })
})

describe("canSaveLegacy / buildLegacyPayload", () => {
  it("accepts a week with the same hours every day", () => {
    expect(canSaveLegacy(uniform())).toBe(true)
    expect(buildLegacyPayload(uniform("09:00:00", "01:00:00"))).toEqual({
      openingTime: "09:00:00",
      closingTime: "01:00:00",
    })
  })

  it("rejects a closed day", () => {
    const days = uniform()
    days[6] = { ...days[6], ...closed }
    expect(canSaveLegacy(days)).toBe(false)
  })

  it("rejects different hours", () => {
    const days = uniform()
    days[4] = { ...days[4], closingTime: "23:00:00" }
    expect(canSaveLegacy(days)).toBe(false)
  })

  it("rejects missing times", () => {
    const days = uniform()
    days[0] = { ...days[0], openingTime: null }
    expect(canSaveLegacy(days)).toBe(false)
  })
})

describe("describeDay", () => {
  it("measures a same-day shift", () => {
    expect(describeDay(uniform()[0])).toEqual({ overnight: false, minutes: 840 })
  })

  it("measures an overnight shift", () => {
    expect(describeDay(uniform("10:00:00", "03:00:00")[0])).toEqual({ overnight: true, minutes: 1020 })
  })

  it("returns null for closed, incomplete or zero-length days", () => {
    expect(describeDay(allClosed()[0])).toBeNull()
    expect(describeDay({ ...uniform()[0], closingTime: null })).toBeNull()
    expect(describeDay({ ...uniform()[0], closingTime: "08:00:00" })).toBeNull()
  })
})

describe("dayErrors / weekError", () => {
  it("has no errors for a valid week", () => {
    expect(dayErrors(uniform()).every((e) => e === null)).toBe(true)
    expect(weekError(uniform())).toBeNull()
  })

  it("flags an open day without times", () => {
    const days = uniform()
    days[1] = { ...days[1], closingTime: null }
    expect(dayErrors(days)[1]).toBe("cfg_day_err_incomplete")
  })

  it("flags equal opening and closing", () => {
    const days = uniform()
    days[2] = { ...days[2], closingTime: "08:00:00" }
    expect(dayErrors(days)[2]).toBe("cfg_day_err_equal")
  })

  it("flags an overnight shift that crosses the next opening", () => {
    const days = uniform()
    days[4] = { ...days[4], openingTime: "20:00:00", closingTime: "10:00:00" }
    expect(dayErrors(days)[4]).toBe("cfg_day_err_overlap")
  })

  it("allows an overnight shift that ends exactly at the next opening or when the next day is closed", () => {
    const days = uniform()
    days[4] = { ...days[4], openingTime: "20:00:00", closingTime: "08:00:00" }
    expect(dayErrors(days)[4]).toBeNull()
    days[5] = { ...days[5], ...closed }
    days[4] = { ...days[4], closingTime: "10:00:00" }
    expect(dayErrors(days)[4]).toBeNull()
  })

  it("wraps Sunday to Monday", () => {
    const days = uniform()
    days[6] = { ...days[6], openingTime: "20:00:00", closingTime: "10:00:00" }
    expect(dayErrors(days)[6]).toBe("cfg_day_err_overlap")
  })

  it("requires at least one open day", () => {
    expect(weekError(allClosed())).toBe("cfg_week_err_none_open")
  })
})

describe("startOfWeek", () => {
  it("returns the Monday at midnight", () => {
    const monday = startOfWeek(new Date(2026, 10, 24, 15, 30)) // Tuesday
    expect([monday.getFullYear(), monday.getMonth(), monday.getDate(), monday.getHours()]).toEqual([2026, 10, 23, 0])
  })

  it("treats Sunday as the end of the week", () => {
    expect(startOfWeek(new Date(2026, 10, 29, 9)).getDate()).toBe(23)
  })
})

describe("closingWindow", () => {
  const weekStart = new Date(2026, 10, 23) // Monday

  it("runs from the opening to the next day's opening", () => {
    const result = closingWindow(uniform(), 1, weekStart)
    expect(result.rollsIntoIndex).toBeNull()
    expect(result.window?.nextIndex).toBe(2)
    expect(result.window?.start).toEqual(new Date(2026, 10, 24, 8, 0))
    expect(result.window?.end).toEqual(new Date(2026, 10, 25, 8, 0))
  })

  it("skips closed days and wraps the week", () => {
    const days = uniform()
    days[5] = { ...days[5], ...closed }
    days[6] = { ...days[6], ...closed }
    days[0] = { ...days[0], openingTime: "09:00:00" }
    const result = closingWindow(days, 4, weekStart)
    expect(result.window?.nextIndex).toBe(0)
    expect(result.window?.start).toEqual(new Date(2026, 10, 27, 8, 0))
    expect(result.window?.end).toEqual(new Date(2026, 10, 30, 9, 0))
  })

  it("ends one week later when it is the only open day", () => {
    const days = week([open("08:00:00", "20:00:00"), ...Array.from({ length: 6 }, () => closed)])
    const result = closingWindow(days, 0, weekStart)
    expect(result.window?.nextIndex).toBe(0)
    expect(result.window?.end).toEqual(new Date(2026, 10, 30, 8, 0))
  })

  it("returns no window for a closed day and points to the last open day before it", () => {
    const days = uniform()
    days[6] = { ...days[6], ...closed }
    days[5] = { ...days[5], ...closed }
    expect(closingWindow(days, 6, weekStart)).toEqual({ window: null, rollsIntoIndex: 4 })
    days[0] = { ...days[0], ...closed }
    expect(closingWindow(days, 0, weekStart).rollsIntoIndex).toBe(4)
  })

  it("has no roll target when nothing is open", () => {
    expect(closingWindow(allClosed(), 2, weekStart)).toEqual({ window: null, rollsIntoIndex: null })
  })
})
