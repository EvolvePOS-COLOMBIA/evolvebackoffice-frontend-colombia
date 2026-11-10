import { describe, expect, it } from "vitest"
import { EMPTY_MOVEMENT_FILTERS, hasMovementFilters, isSet } from "../movement-filter-form"

describe("movement filters", () => {
  it("treats 'all' as no filter only in the option lists", () => {
    expect(hasMovementFilters(EMPTY_MOVEMENT_FILTERS)).toBe(false)
    expect(isSet({ ...EMPTY_MOVEMENT_FILTERS, search: "all" }, "search")).toBe(true)
    expect(isSet({ ...EMPTY_MOVEMENT_FILTERS, notes: "all" }, "notes")).toBe(true)
    expect(hasMovementFilters({ ...EMPTY_MOVEMENT_FILTERS, type: "all" })).toBe(false)
    expect(hasMovementFilters({ ...EMPTY_MOVEMENT_FILTERS, type: "Waste" })).toBe(true)
  })
})
