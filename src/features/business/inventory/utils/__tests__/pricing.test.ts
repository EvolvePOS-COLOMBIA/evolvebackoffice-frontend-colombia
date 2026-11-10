import { describe, expect, it } from "vitest"
import { defaultLinePrice, percentBase, priceBase, resolvePrice, scaleBase, type LinePrice } from "../pricing"

const price = (patch: Partial<LinePrice>): LinePrice => ({ mode: "sale", percent: "", special: "", ...patch })

describe("priceBase", () => {
  it("treats zero or negative values as missing", () => {
    expect(priceBase(0, -5)).toEqual({ sale: null, cost: null })
    expect(priceBase(1200, undefined)).toEqual({ sale: 1200, cost: null })
  })
})

describe("scaleBase", () => {
  it("converts both prices to the chosen unit", () => {
    expect(scaleBase({ sale: 100, cost: 60 }, 40)).toEqual({ sale: 4000, cost: 2400 })
    expect(scaleBase({ sale: null, cost: 60 }, 2)).toEqual({ sale: null, cost: 120 })
  })
})

describe("defaultLinePrice", () => {
  it("starts on the sale price, or on the cost when there is no sale price", () => {
    expect(defaultLinePrice({ sale: 100, cost: 60 }).mode).toBe("sale")
    expect(defaultLinePrice({ sale: null, cost: 60 }).mode).toBe("cost")
    expect(defaultLinePrice({ sale: null, cost: null }).mode).toBe("sale")
  })
})

describe("percentBase", () => {
  it("uses the sale price, falling back to the cost", () => {
    expect(percentBase({ sale: 100, cost: 60 })).toBe(100)
    expect(percentBase({ sale: null, cost: 60 })).toBe(60)
    expect(percentBase({ sale: null, cost: null })).toBeNull()
  })
})

describe("resolvePrice", () => {
  const base = { sale: 1000, cost: 600 }

  it("returns the sale price or the cost", () => {
    expect(resolvePrice(base, price({ mode: "sale" }))).toBe(1000)
    expect(resolvePrice(base, price({ mode: "cost" }))).toBe(600)
  })

  it("adds the percentage over the sale price, rounded to cents", () => {
    expect(resolvePrice(base, price({ mode: "percent", percent: "15" }))).toBe(1150)
    expect(resolvePrice({ sale: 333.33, cost: null }, price({ mode: "percent", percent: "10" }))).toBe(366.66)
  })

  it("adds the percentage over the cost when there is no sale price", () => {
    expect(resolvePrice({ sale: null, cost: 600 }, price({ mode: "percent", percent: "50" }))).toBe(900)
  })

  it("treats an empty percentage as 0 %", () => {
    expect(resolvePrice(base, price({ mode: "percent", percent: "" }))).toBe(1000)
  })

  it("accepts a special price of 0 or more", () => {
    expect(resolvePrice(base, price({ mode: "special", special: "0" }))).toBe(0)
    expect(resolvePrice(base, price({ mode: "special", special: "750.5" }))).toBe(750.5)
  })

  it("returns null when it cannot compute a price", () => {
    expect(resolvePrice(base, price({ mode: "special", special: " " }))).toBeNull()
    expect(resolvePrice(base, price({ mode: "special", special: "-1" }))).toBeNull()
    expect(resolvePrice(base, price({ mode: "percent", percent: "abc" }))).toBeNull()
    expect(resolvePrice({ sale: null, cost: null }, price({ mode: "percent", percent: "10" }))).toBeNull()
    expect(resolvePrice(base, price({ mode: "percent", percent: "-150" }))).toBeNull()
  })
})
