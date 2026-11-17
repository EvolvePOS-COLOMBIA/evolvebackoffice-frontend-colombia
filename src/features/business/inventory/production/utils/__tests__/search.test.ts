import { describe, expect, it } from "vitest"

import type { ProductionOrderSummaryDto } from "../../../types/production"
import { filterProductionOrders } from "../search"

const order = (overrides: Partial<ProductionOrderSummaryDto> = {}): ProductionOrderSummaryDto => ({
  id: "order-1",
  number: "PRO-1042",
  branchId: "branch-1",
  branchName: "Main branch",
  status: "Completed",
  totalCost: 125000,
  createdAt: "2026-10-01T08:00:00.000Z",
  completedAt: "2026-10-01T09:00:00.000Z",
  products: [
    {
      itemId: "item-1",
      itemName: "Almuerzo ejecutivo",
      baseUnit: 1,
      plannedQuantity: 10,
      producedQuantity: 9,
    },
  ],
  ...overrides,
})

describe("filterProductionOrders", () => {
  const items = [
    order({
      id: "order-1",
      number: "PRO-1042",
      products: [
        { itemId: "item-1", itemName: "Almuerzo ejecutivo", baseUnit: 1, plannedQuantity: 10, producedQuantity: 9 },
      ],
    }),
    order({
      id: "order-2",
      number: "PRO-2001",
      products: [
        { itemId: "item-2", itemName: "Ensalada César", baseUnit: 1, plannedQuantity: 5, producedQuantity: null },
      ],
    }),
  ]

  it("returns every item when the search is empty or whitespace", () => {
    expect(filterProductionOrders(items, "")).toEqual(items)
    expect(filterProductionOrders(items, "   ")).toEqual(items)
  })

  it("matches by order number, ignoring case", () => {
    expect(filterProductionOrders(items, "pro-1042").map((item) => item.id)).toEqual(["order-1"])
    expect(filterProductionOrders(items, "2001").map((item) => item.id)).toEqual(["order-2"])
  })

  it("matches by product name, ignoring case and accents", () => {
    expect(filterProductionOrders(items, "almuerzo ejecutivo").map((item) => item.id)).toEqual(["order-1"])
    expect(filterProductionOrders(items, "ALMUERZO").map((item) => item.id)).toEqual(["order-1"])
    expect(filterProductionOrders(items, "ensalada cesar").map((item) => item.id)).toEqual(["order-2"])
    expect(filterProductionOrders(items, "CESAR").map((item) => item.id)).toEqual(["order-2"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterProductionOrders(items, "producto inexistente")).toEqual([])
  })

  it("does not throw on orders without products", () => {
    const bare = [order({ id: "order-3", number: "PRO-3007", products: [] })]
    expect(filterProductionOrders(bare, "PRO-3007").map((item) => item.id)).toEqual(["order-3"])
    expect(filterProductionOrders(bare, "nada")).toEqual([])
  })
})
