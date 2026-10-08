import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/config/axios-client"
import {
  assignOrderCourier,
  getCouriers,
  getDeliveryBoard,
  setCourierActive,
} from "@/features/business/orders/services/couriers.service"
import { reconcileOrderPayments } from "@/features/business/orders/services/order-closings.service"
import { updateOrderStatus } from "@/features/business/orders/services/orders.service"

vi.mock("@/config/axios-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api)

describe("couriers.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getCouriers normaliza { data, totalCount } y omite filtros vacíos", async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [{ id: "c1", name: "Pedro" }], totalCount: 21 } })

    const result = await getCouriers({ branchId: null, pageSize: 20 })

    expect(mockedApi.get).toHaveBeenCalledWith("/api/couriers", {
      params: { pageNumber: 1, pageSize: 20, branchId: undefined, includeInactive: undefined, searchValue: undefined },
    })
    expect(result.data).toHaveLength(1)
    expect(result.totalCount).toBe(21)
    expect(result.totalPages).toBe(2)
  })

  it("getCouriers tolera una respuesta sin data", async () => {
    mockedApi.get.mockResolvedValue({ data: null })
    const result = await getCouriers({})
    expect(result).toEqual({ data: [], totalCount: 0, totalPages: 0 })
  })

  it("setCourierActive usa activate/deactivate", async () => {
    mockedApi.post.mockResolvedValue({})
    await setCourierActive("c1", true)
    await setCourierActive("c1", false)
    expect(mockedApi.post).toHaveBeenNthCalledWith(1, "/api/couriers/c1/activate")
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, "/api/couriers/c1/deactivate")
  })

  it("assignOrderCourier envía null para quitar el domiciliario", async () => {
    mockedApi.put.mockResolvedValue({})
    await assignOrderCourier("o1", null)
    expect(mockedApi.put).toHaveBeenCalledWith("/api/orders/o1/courier", { courierId: null })
  })

  it("getDeliveryBoard pasa sucursal y fecha solo si existen", async () => {
    mockedApi.get.mockResolvedValue({ data: { couriers: [], unassigned: [] } })
    await getDeliveryBoard({ branchId: "b1", date: "" })
    expect(mockedApi.get).toHaveBeenCalledWith("/api/orders/deliveries", {
      params: { branchId: "b1", courierId: undefined, date: undefined },
    })
  })
})

describe("estado y conciliación con domiciliario", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updateOrderStatus incluye courierId solo cuando viene", async () => {
    mockedApi.put.mockResolvedValue({})
    await updateOrderStatus("o1", "Shipped", "c1")
    await updateOrderStatus("o1", "Delivered")
    expect(mockedApi.put).toHaveBeenNthCalledWith(1, "/api/orders/o1/status", { status: "Shipped", courierId: "c1" })
    expect(mockedApi.put).toHaveBeenNthCalledWith(2, "/api/orders/o1/status", { status: "Delivered" })
  })

  it("reconcileOrderPayments envía los pagos con efectivo recibido", async () => {
    mockedApi.put.mockResolvedValue({ data: { orderId: "o1", reconciled: true, payments: [], totals: [] } })
    const payments = [
      { paymentMethodCode: "EFECTIVO", amount: 30000, tenderedAmount: 50000 },
      { paymentMethodCode: "TARJETA", amount: 25000, reference: "1234" },
    ]
    const result = await reconcileOrderPayments("o1", payments)
    expect(mockedApi.put).toHaveBeenCalledWith("/api/orders/o1/reconcile", { payments })
    expect(result.reconciled).toBe(true)
  })
})
