import { describe, expect, it } from "vitest"

import { getCustomerDisplayName } from "../index"

describe("getCustomerDisplayName", () => {
  it("returns fullName when it is non-empty", () => {
    const result = getCustomerDisplayName({
      fullName: "Carlos Perez",
      firstName: "Other",
      lastName: "Name",
    })
    expect(result).toBe("Carlos Perez")
  })

  it("trims whitespace from fullName", () => {
    const result = getCustomerDisplayName({
      fullName: "  Carlos Perez  ",
      firstName: null,
      lastName: null,
    })
    expect(result).toBe("Carlos Perez")
  })

  it("composes firstName + lastName when fullName is null", () => {
    const result = getCustomerDisplayName({
      fullName: null,
      firstName: "Carlos",
      lastName: "Perez",
    })
    expect(result).toBe("Carlos Perez")
  })

  it("composes firstName + lastName when fullName is empty", () => {
    const result = getCustomerDisplayName({
      fullName: "",
      firstName: "Ana",
      lastName: "Garcia",
    })
    expect(result).toBe("Ana Garcia")
  })

  it("returns only firstName when lastName is null", () => {
    const result = getCustomerDisplayName({
      fullName: null,
      firstName: "Carlos",
      lastName: null,
    })
    expect(result).toBe("Carlos")
  })

  it("returns only lastName when firstName is null", () => {
    const result = getCustomerDisplayName({
      fullName: null,
      firstName: null,
      lastName: "Perez",
    })
    expect(result).toBe("Perez")
  })

  it("returns dash when all name fields are null or empty", () => {
    const result = getCustomerDisplayName({
      fullName: null,
      firstName: null,
      lastName: null,
    })
    expect(result).toBe("—")
  })

  it("returns dash when fullName is whitespace-only and no first/last", () => {
    const result = getCustomerDisplayName({
      fullName: "   ",
      firstName: null,
      lastName: null,
    })
    expect(result).toBe("—")
  })
})
