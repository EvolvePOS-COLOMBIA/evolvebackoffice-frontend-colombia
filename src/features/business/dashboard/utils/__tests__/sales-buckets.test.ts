import { describe, expect, it } from "vitest"

import { fillSalesBuckets } from "../sales-buckets"

const point = (label: string, sales: number, transactions: number) => ({ label, sales, transactions })

// Tuesday 17 November 2026
const NOW = new Date(2026, 10, 17, 12, 0, 0)

describe("fillSalesBuckets", () => {
  describe("week", () => {
    it("returns the 7 days of the week (Sunday first) even when the API sends a single day", () => {
      const result = fillSalesBuckets([point("Mon", 33000, 3)], "week", NOW)

      expect(result.map((p) => p.label)).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
      expect(result.find((p) => p.label === "Mon")).toEqual(point("Mon", 33000, 3))
      expect(result.filter((p) => p.label !== "Mon").every((p) => p.sales === 0 && p.transactions === 0)).toBe(true)
    })

    it("matches localized day labels by day of week and keeps the label the API sent", () => {
      const result = fillSalesBuckets([point("Lun", 100, 1), point("Sáb", 50, 2)], "week", NOW)

      expect(result).toHaveLength(7)
      expect(result[1]).toEqual(point("Lun", 100, 1))
      expect(result[6]).toEqual(point("Sáb", 50, 2))
    })

    it("returns a zeroed week when there are no sales", () => {
      const result = fillSalesBuckets([], "week", NOW)

      expect(result).toHaveLength(7)
      expect(result.every((p) => p.sales === 0 && p.transactions === 0)).toBe(true)
    })
  })

  describe("month", () => {
    it("fills every day from the 1st to today and keeps the days with sales", () => {
      const result = fillSalesBuckets([point("7", 471500, 8), point("16", 33000, 3)], "month", NOW)

      expect(result).toHaveLength(17)
      expect(result[0].label).toBe("1")
      expect(result[16].label).toBe("17")
      expect(result[6]).toEqual(point("7", 471500, 8))
      expect(result[15]).toEqual(point("16", 33000, 3))
      expect(result[8]).toEqual(point("9", 0, 0))
    })

    it("never drops a day the API sent that is later than today (clock/timezone drift)", () => {
      const result = fillSalesBuckets([point("19", 10, 1)], "month", NOW)

      expect(result).toHaveLength(19)
      expect(result[18]).toEqual(point("19", 10, 1))
    })
  })

  describe("day", () => {
    it("leaves the hourly series untouched (the API already sends all 24 hours)", () => {
      const hours = [point("12 AM", 0, 0), point("1 AM", 5, 1)]

      expect(fillSalesBuckets(hours, "day", NOW)).toEqual(hours)
    })
  })

  it("returns the points as they came when a label is not recognized, instead of dropping data", () => {
    const weird = [point("Mon", 1, 1), point("Semana X", 9, 9)]
    expect(fillSalesBuckets(weird, "week", NOW)).toEqual(weird)

    const weirdMonth = [point("7", 1, 1), point("hoy", 9, 9)]
    expect(fillSalesBuckets(weirdMonth, "month", NOW)).toEqual(weirdMonth)
  })

  it("does not mutate the input", () => {
    const input = [point("Mon", 1, 1)]
    const copy = JSON.parse(JSON.stringify(input))

    fillSalesBuckets(input, "week", NOW)

    expect(input).toEqual(copy)
  })
})
