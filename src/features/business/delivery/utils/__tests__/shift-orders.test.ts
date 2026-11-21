import { describe, expect, it } from "vitest"

import type { DeliveryShiftOrderDto } from "../../types"
import { pendingDeliveries } from "../shift-orders"

const order = (orderId: string, status: string, createdAt: string): DeliveryShiftOrderDto => ({
  orderId,
  externalOrderId: null,
  status,
  total: 10000,
  shippingCost: 3000,
  advanceAmount: 0,
  hasAdvance: false,
  createdAt,
  paymentMethod: "EFECTIVO",
  shippingStreet: null,
  shippingCity: null,
})

describe("pendingDeliveries", () => {
  it("keeps only the shift orders that are on the way, oldest first", () => {
    const result = pendingDeliveries([
      order("late", "Shipped", "2026-11-21T15:00:00Z"),
      order("done", "Delivered", "2026-11-21T13:00:00Z"),
      order("early", "Shipped", "2026-11-21T14:00:00Z"),
      order("cancelled", "Cancelled", "2026-11-21T12:00:00Z"),
    ])

    expect(result.map((o) => o.orderId)).toEqual(["early", "late"])
  })

  it("returns an empty list when the courier has nothing on the way", () => {
    expect(pendingDeliveries([order("done", "Delivered", "2026-11-21T13:00:00Z")])).toEqual([])
  })
})
