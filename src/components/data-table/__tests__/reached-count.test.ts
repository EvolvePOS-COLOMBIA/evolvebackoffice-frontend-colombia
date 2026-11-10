import { describe, expect, it } from "vitest"
import { computeReachedCount } from "../reached-count"

describe("computeReachedCount", () => {
  it("counts the rows of the first page", () => {
    expect(computeReachedCount(1, 10, 30, 3)).toBe(10)
  })

  it("accumulates a middle page", () => {
    expect(computeReachedCount(2, 10, 30, 3)).toBe(20)
  })

  it("reaches the total on an exact last page", () => {
    expect(computeReachedCount(3, 10, 30, 3)).toBe(30)
  })

  it("reaches the total on a partial last page", () => {
    expect(computeReachedCount(3, 5, 25, 3)).toBe(25)
  })

  it("handles a single full page", () => {
    expect(computeReachedCount(1, 7, 7, 1)).toBe(7)
  })

  it("returns null when there is nothing to show", () => {
    expect(computeReachedCount(1, 0, 0, 0)).toBeNull()
    expect(computeReachedCount(1, 10, 0, 0)).toBeNull()
    expect(computeReachedCount(0, 10, 30, 3)).toBeNull()
  })

  it("accumulates a middle page of a non-full dataset", () => {
    expect(computeReachedCount(2, 10, 25, 3)).toBe(20)
  })
})
