import { describe, expect, it } from "vitest"

import { describeSchedule, toApiTime, toInputTime, toMinutes } from "../schedule"

describe("time helpers", () => {
  it("reads HH:mm and HH:mm:ss", () => {
    expect(toMinutes("08:30")).toBe(510)
    expect(toMinutes("23:59:59")).toBe(1439)
  })

  it("converts between the input and the API formats", () => {
    expect(toInputTime("08:00:00")).toBe("08:00")
    expect(toInputTime("08:00")).toBe("08:00")
    expect(toApiTime("08:00")).toBe("08:00:00")
    expect(toApiTime("08:00:00")).toBe("08:00:00")
  })
})

describe("describeSchedule", () => {
  it("places the opening hours on a 24 hour track", () => {
    expect(describeSchedule("06:00", "18:00")).toEqual({
      startPercent: 25,
      widthPercent: 50,
      minutes: 720,
      overnight: false,
    })
  })

  it("wraps a day that closes after midnight", () => {
    const schedule = describeSchedule("20:00", "02:00")
    expect(schedule.overnight).toBe(true)
    expect(schedule.minutes).toBe(6 * 60)
    expect(schedule.startPercent + schedule.widthPercent).toBeLessThanOrEqual(100)
  })

  it("treats equal times as a full day", () => {
    expect(describeSchedule("00:00", "00:00").minutes).toBe(24 * 60)
  })
})
