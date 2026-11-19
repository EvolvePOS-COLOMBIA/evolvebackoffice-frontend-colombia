import { describe, expect, it } from "vitest"

import { normalizeOrderStatus, toOrderListItem } from "../active-order"

const base = {
  id: "ord-1",
  branchId: "br-1",
  branchName: "Sede Bogotá",
  customerName: "Ana",
  phone: "300",
  items: ["COCA-COLA"],
  itemCount: 1,
  total: 4500,
  createdAt: "07/11/2026 10:59",
  estimatedDelivery: "",
  status: "Confirmed",
  progress: 25,
  address: "Calle 1",
  paymentMethod: "CASH",
}

describe("normalizeOrderStatus", () => {
  it("maps any dashboard variant to the status code the orders module uses", () => {
    expect(normalizeOrderStatus("pending")).toBe("Pending")
    expect(normalizeOrderStatus("Confirmed")).toBe("Confirmed")
    expect(normalizeOrderStatus("on-the-way")).toBe("Shipped")
    expect(normalizeOrderStatus("canceled")).toBe("Cancelled")
    expect(normalizeOrderStatus("needs review")).toBe("NeedsReview")
  })

  it("keeps unknown statuses untouched", () => {
    expect(normalizeOrderStatus("Weird")).toBe("Weird")
  })
})

describe("toOrderListItem", () => {
  it("seeds the order detail dialog with what the dashboard already knows", () => {
    const item = toOrderListItem(base)
    expect(item).toMatchObject({
      id: "ord-1",
      branchId: "br-1",
      branchName: "Sede Bogotá",
      statusCode: "Confirmed",
      total: 4500,
      paymentMethod: "CASH",
      shippingStreet: "Calle 1",
    })
  })

  it("never leaves required numeric fields undefined", () => {
    const item = toOrderListItem({ ...base, total: undefined as unknown as number })
    expect(item.total).toBe(0)
    expect(item.subTotal).toBe(0)
    expect(item.shippingCost).toBe(0)
  })
})
