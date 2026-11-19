import { describe, expect, it } from "vitest"

import type { OrderClosingOrderRow } from "../../types/closing"
import {
  closingStatusCode,
  humanizeCode,
  shortClosingReference,
  statusGroup,
  summarizeClosing,
} from "../closing-summary"

const row = (id: string, status: string, method: string | null, total: number): OrderClosingOrderRow => ({
  id,
  reference: `POSCO-${id}0000000000000000`,
  origin: "POSCO",
  status,
  declaredPaymentMethod: method,
  customerName: null,
  total,
  createdAt: "2026-11-18T10:00:00Z",
  reconciled: false,
  reconcilePaymentMethodCode: null,
  reconciledAt: null,
})

describe("closingStatusCode", () => {
  it("maps the backend spelling to the status code of the orders module", () => {
    expect(closingStatusCode("CANCELLED")).toBe("Cancelled")
    expect(closingStatusCode("NEEDSREVIEW")).toBe("NeedsReview")
    expect(closingStatusCode("Delivered")).toBe("Delivered")
  })

  it("returns undefined for unknown statuses", () => {
    expect(closingStatusCode("WEIRD")).toBeUndefined()
  })
})

describe("statusGroup", () => {
  it("separates in-progress, finished and cancelled orders", () => {
    expect(statusGroup("CONFIRMED")).toBe("open")
    expect(statusGroup("SHIPPED")).toBe("open")
    expect(statusGroup("DELIVERED")).toBe("done")
    expect(statusGroup("CANCELLED")).toBe("cancelled")
    expect(statusGroup("REFUNDED")).toBe("cancelled")
  })
})

describe("shortClosingReference", () => {
  it("keeps the platform and the first six characters, like the orders board", () => {
    expect(shortClosingReference("POSCO-aef188763ebb49eba917886a107433d0")).toBe("POSCO-aef188")
  })

  it("leaves short or unprefixed references alone", () => {
    expect(shortClosingReference("A12")).toBe("A12")
  })
})

describe("humanizeCode", () => {
  it("makes a payment code readable", () => {
    expect(humanizeCode("TARJETA_CREDITO")).toBe("Tarjeta credito")
  })
})

describe("summarizeClosing", () => {
  const orders = [
    row("a", "DELIVERED", "CASH", 10000),
    row("b", "DELIVERED", "ONLINE", 5000),
    row("c", "CONFIRMED", "CASH", 2000),
    row("d", "CANCELLED", "CASH", 3000),
  ]

  it("excludes cancelled orders when the backend total leaves them out", () => {
    const summary = summarizeClosing(orders, 17000)
    expect(summary.excludesCancelled).toBe(true)
    expect(summary.counted).toHaveLength(3)
    expect(summary.cancelled).toEqual({ count: 1, total: 3000 })
  })

  it("keeps every order when the backend total includes the cancelled ones", () => {
    const summary = summarizeClosing(orders, 20000)
    expect(summary.excludesCancelled).toBe(false)
    expect(summary.counted).toHaveLength(4)
  })

  it("reports the orders that are still in progress", () => {
    expect(summarizeClosing(orders, 17000).open).toEqual({ count: 1, total: 2000 })
  })

  it("groups the counted total by declared payment method, biggest first", () => {
    const { byMethod } = summarizeClosing(orders, 17000)
    expect(byMethod).toEqual([
      { code: "CASH", total: 12000 },
      { code: "ONLINE", total: 5000 },
    ])
  })

  it("puts orders without a declared method under an empty code", () => {
    const { byMethod } = summarizeClosing([row("a", "DELIVERED", null, 100)], 100)
    expect(byMethod).toEqual([{ code: "", total: 100 }])
  })

  it("handles an empty window", () => {
    const summary = summarizeClosing([], 0)
    expect(summary.counted).toEqual([])
    expect(summary.byMethod).toEqual([])
    expect(summary.open).toEqual({ count: 0, total: 0 })
  })
})
