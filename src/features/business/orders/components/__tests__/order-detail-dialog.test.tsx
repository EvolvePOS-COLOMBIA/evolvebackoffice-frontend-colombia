/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { OrderDetailDialog } from "../order-detail-dialog"
import { useOrderDetail } from "../../hooks/use-orders"
import type { OrderDetail, OrderItemDto, OrderListItem } from "../../types/api"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
    i18n: { language: "es" },
  }),
}))

vi.mock("../../hooks/use-orders", () => ({
  useOrderDetail: vi.fn(),
}))

vi.mock("../cancel-order-dialog", () => ({
  CancelOrderDialog: () => null,
}))

const mockedUseOrderDetail = vi.mocked(useOrderDetail)
type DetailQueryResult = ReturnType<typeof useOrderDetail>

const ITEMS: OrderItemDto[] = [
  {
    id: "line-1",
    itemId: "cat-1",
    externalItemId: null,
    name: "Hamburguesa Doble",
    sku: "HAM-001",
    quantity: 2,
    unitPrice: 15000,
    subtotal: 30000,
    tax: 0,
    discount: 0,
    modifiersJson: null,
  },
  {
    id: "line-2",
    itemId: null,
    externalItemId: null,
    name: "Coca Cola",
    sku: null,
    quantity: 1,
    unitPrice: 5000,
    subtotal: 5000,
    tax: 0,
    discount: 0,
    modifiersJson: null,
  },
]

const ORDER: OrderListItem = {
  id: "ord-1",
  externalOrderId: "EXT-123456789012345",
  platformCode: "POSCO",
  origin: "WhatsApp",
  branchId: "br-1",
  branchName: "Sede Norte",
  statusCode: "Pending",
  statusName: "Pendiente",
  subTotal: 35000,
  tax: 0,
  discount: 0,
  shippingCost: 0,
  total: 35000,
  paymentMethod: "CASH",
  externalCreatedAt: new Date().toISOString(),
  externalUpdatedAt: null,
  createdAt: new Date().toISOString(),
  shippingCity: "Bogotá",
  shippingStreet: "Cra 7 # 12-34",
  cancellationType: null,
  wasteCost: null,
  wastedAt: null,
}

function mockDetail(items: OrderItemDto[] | undefined, statusName = "Pendiente") {
  const detail = items
    ? ({ ...ORDER, statusName, items, cancellationReason: null, wastedBy: null } as unknown as OrderDetail)
    : undefined
  mockedUseOrderDetail.mockReturnValue({ data: detail } as unknown as DetailQueryResult)
}

function renderDialog() {
  return render(<OrderDetailDialog open onOpenChange={vi.fn()} order={ORDER} />)
}

describe("OrderDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists every product of the order with quantity and name", () => {
    mockDetail(ITEMS)

    renderDialog()

    expect(screen.getByText("Hamburguesa Doble")).toBeInTheDocument()
    expect(screen.getByText("2×")).toBeInTheDocument()
    expect(screen.getByText("Coca Cola")).toBeInTheDocument()
    expect(screen.getByText("1×")).toBeInTheDocument()
  })

  it("shows customer and notes only when the detail provides them", () => {
    mockedUseOrderDetail.mockReturnValue({
      data: { ...ORDER, items: ITEMS, customerName: "María Pérez", notes: "Sin cilantro" },
    } as unknown as DetailQueryResult)

    renderDialog()

    expect(screen.getByText("María Pérez")).toBeInTheDocument()
    expect(screen.getByText("Sin cilantro")).toBeInTheDocument()
  })

  it("hides shipping and discount rows when they are zero", () => {
    mockDetail(ITEMS)

    renderDialog()

    expect(screen.queryByText("shipping_cost")).toBeNull()
    expect(screen.queryByText("discount")).toBeNull()
    expect(screen.getByText("subtotal")).toBeInTheDocument()
  })

  it("humanizes payment codes that have no translation", () => {
    mockedUseOrderDetail.mockReturnValue({
      data: { ...ORDER, items: ITEMS, paymentMethod: "TARJETA_CREDITO" },
    } as unknown as DetailQueryResult)

    renderDialog()

    expect(screen.getByText("Tarjeta credito")).toBeInTheDocument()
  })

  it("shows the SKU only for lines that have one", () => {
    mockDetail(ITEMS)

    renderDialog()

    expect(screen.getByText("HAM-001")).toBeInTheDocument()
    expect(screen.queryByText("null")).toBeNull()
  })

  it("shows a loading placeholder instead of an empty list while the detail is not loaded", () => {
    mockDetail(undefined)

    renderDialog()

    expect(screen.getByText("order_items_loading")).toBeInTheDocument()
  })

  it("shows an empty message when the order has no products", () => {
    mockDetail([])

    renderDialog()

    expect(screen.getByText("order_items_empty")).toBeInTheDocument()
  })
})
