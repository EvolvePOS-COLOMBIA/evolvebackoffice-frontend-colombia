import { describe, expect, it } from "vitest"

import { orderReference } from "../order-reference"

describe("orderReference", () => {
  it("shows the branch order number when the order has one", () => {
    expect(orderReference({ id: "a1b2c3d4-0000", orderNumber: "100001", externalOrderId: "POSCO-d8781abc" })).toBe(
      "100001"
    )
  })

  it("falls back to the external id, then to the id, for orders without number", () => {
    expect(orderReference({ id: "a1b2c3d4-0000", orderNumber: null, externalOrderId: "POSCO-d8781abc" })).toBe(
      "POSCO-d8"
    )
    expect(orderReference({ id: "a1b2c3d4-0000", externalOrderId: null })).toBe("a1b2c3d4")
  })
})
