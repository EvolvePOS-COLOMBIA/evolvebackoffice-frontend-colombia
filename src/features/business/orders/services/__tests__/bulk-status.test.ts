import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/config/axios-client"
import { bulkUpdateOrderStatus } from "../orders.service"
import { bulkStockWarnings, isDeliveryOrder, MAX_BULK_ORDERS } from "../../utils/bulk-status"
import type { OrderListItem, OrderStockItem } from "../../types/api"

vi.mock("@/config/axios-client", () => ({ api: { put: vi.fn() } }))
const mockApi = vi.mocked(api, { deep: true })
const order = (id: string, branchId = "b1") => ({ id, branchId }) as OrderListItem
const stock = (requested: number, available = 5): OrderStockItem => ({
  itemId: "item",
  name: "Producto",
  sku: null,
  requested,
  available,
  sufficient: requested <= available,
  tracksInventory: true,
})

describe("bulk order status", () => {
  beforeEach(() => vi.clearAllMocks())
  it("uses the tenant JWT API and returns per-order results", async () => {
    const result = {
      results: [{ orderId: "o1", succeeded: true, statusCode: 204, message: null }],
      successCount: 1,
      failureCount: 0,
    }
    mockApi.put.mockResolvedValue({ data: result })
    const body = { orderIds: ["o1", "o2"], status: "Shipped" as const, courierId: "delivery-user" }
    expect(await bulkUpdateOrderStatus(body)).toEqual(result)
    expect(mockApi.put).toHaveBeenCalledWith("/api/orders/status/bulk", body, { timeout: 600000 })
    expect(MAX_BULK_ORDERS).toBe(50)
  })
  it("aggregates demand even when individual orders have enough stock", () => {
    const warnings = bulkStockWarnings(
      [order("o1"), order("o2")],
      [
        { hasShortage: false, items: [stock(3)] },
        { hasShortage: false, items: [stock(3)] },
      ]
    )
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ requested: 6, available: 5 })
  })
  it("does not mix inventory across branches", () => {
    expect(
      bulkStockWarnings(
        [order("o1"), order("o2", "b2")],
        [
          { hasShortage: false, items: [stock(3)] },
          { hasShortage: false, items: [stock(3)] },
        ]
      )
    ).toEqual([])
  })
  it("does not warn for untracked products or sufficient stock", () => {
    expect(
      bulkStockWarnings(
        [order("o1")],
        [
          {
            hasShortage: true,
            items: [
              { ...stock(30, 0), tracksInventory: false },
              { ...stock(1), itemId: "other" },
            ],
          },
        ]
      )
    ).toEqual([])
  })
  it("respects explicit pickup type even when it has an address", () => {
    expect(isDeliveryOrder({ ...order("o1"), fulfillmentType: "Pickup", shippingStreet: "street" })).toBe(false)
    expect(isDeliveryOrder({ ...order("o1"), fulfillmentType: "Delivery" })).toBe(true)
    expect(isDeliveryOrder({ ...order("o1"), shippingStreet: "street" })).toBe(true)
  })
})
