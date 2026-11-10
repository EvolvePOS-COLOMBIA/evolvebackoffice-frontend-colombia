/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { OrderCard } from "../order-card"
import { useOrderDetail } from "../../hooks/use-orders"
import type { OrderDetail, OrderItemDto, OrderListItem } from "../../types/api"

// Deterministic i18n stub: t(key) → key, t(key, opts) → "key:{json}".
vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
    i18n: { language: "es" },
  }),
}))

vi.mock("../../hooks/use-orders", () => ({
  useOrderDetail: vi.fn(),
}))

const mockedUseOrderDetail = vi.mocked(useOrderDetail)
type DetailQueryResult = ReturnType<typeof useOrderDetail>

const ITEMS: OrderItemDto[] = [
  {
    id: "item-1",
    nameSnapshot: "Hamburguesa Doble",
    quantity: 2,
    unitPrice: 15000,
    subtotal: 30000,
    tax: 0,
    discount: 0,
    skuSnapshot: null,
    externalItemId: null,
    modifiersJson: null,
  },
  {
    id: "item-2",
    nameSnapshot: "Coca Cola",
    quantity: 1,
    unitPrice: 5000,
    subtotal: 5000,
    tax: 0,
    discount: 0,
    skuSnapshot: null,
    externalItemId: null,
    modifiersJson: null,
  },
  {
    id: "item-3",
    nameSnapshot: "Papas Fritas",
    quantity: 1,
    unitPrice: 5000,
    subtotal: 5000,
    tax: 0,
    discount: 0,
    skuSnapshot: null,
    externalItemId: null,
    modifiersJson: null,
  },
]

function makeOrder(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    id: "ord-1",
    externalOrderId: "EXT-123456789012345",
    platformCode: "POSCO",
    origin: "WhatsApp",
    branchId: "br-1",
    branchName: "Sede Norte",
    statusCode: "Pending",
    statusName: "Pendiente",
    subTotal: 40000,
    tax: 0,
    discount: 0,
    shippingCost: 2000,
    total: 42000,
    paymentMethod: "CASH",
    externalCreatedAt: new Date().toISOString(),
    externalUpdatedAt: null,
    createdAt: new Date().toISOString(),
    shippingCity: "Bogotá",
    shippingStreet: "Cra 7 # 12-34",
    cancellationType: null,
    wasteCost: null,
    wastedAt: null,
    ...overrides,
  }
}

function makeDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    ...makeOrder(),
    customerId: "cus-1",
    customerName: "María Pérez",
    personId: null,
    personName: null,
    notes: "Sin cilantro",
    shippingState: "Bogotá D.C.",
    shippingZipCode: "110111",
    shippingLatitude: null,
    shippingLongitude: null,
    shippingNotes: null,
    needsOutboundSync: true,
    items: ITEMS,
    cancellationReason: null,
    wastedBy: null,
    ...overrides,
  }
}

function mockDetailQuery(detail?: OrderDetail, extra: { isLoading?: boolean; isError?: boolean } = {}) {
  mockedUseOrderDetail.mockReturnValue({
    data: detail,
    isLoading: extra.isLoading ?? false,
    isError: extra.isError ?? false,
  } as unknown as DetailQueryResult)
}

interface RenderProps {
  showBranch?: boolean
  priority?: boolean
  onViewDetail?: (order: OrderListItem) => void
  onCancelOrder?: (order: OrderListItem) => void
}

function renderCard(order: OrderListItem, props: RenderProps = {}) {
  return render(
    <OrderCard
      order={order}
      showBranch={props.showBranch ?? false}
      priority={props.priority ?? false}
      onViewDetail={props.onViewDetail ?? vi.fn()}
      onCancelOrder={props.onCancelOrder ?? vi.fn()}
    />
  )
}

describe("OrderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetailQuery()
  })

  it("renders reference, address with city, platform badge, price, payment and origin", () => {
    mockDetailQuery(makeDetail())

    renderCard(makeOrder())

    expect(screen.getByText("#EXT-12345678")).toBeInTheDocument()
    expect(screen.getByText("Cra 7 # 12-34 · Bogotá")).toBeInTheDocument()
    expect(screen.getByText("POSCO")).toBeInTheDocument()
    expect(screen.getByText(/42[.,]000/)).toBeInTheDocument()
    expect(screen.getByText("pay_cash")).toBeInTheDocument()
    expect(screen.getByText("origin_whatsapp")).toBeInTheDocument()
  })

  it("invokes onCancelOrder with the order from the cancel button", () => {
    const onCancelOrder = vi.fn()
    const order = makeOrder({ statusCode: "Pending" })

    renderCard(order, { onCancelOrder })

    fireEvent.click(screen.getByLabelText("cancel_order"))
    expect(onCancelOrder).toHaveBeenCalledWith(order)
  })

  it("hides the cancel action for Delivered and Cancelled orders", () => {
    const first = renderCard(makeOrder({ statusCode: "Delivered" }))
    expect(screen.queryByLabelText("cancel_order")).toBeNull()
    first.unmount()

    renderCard(makeOrder({ statusCode: "Cancelled" }))
    expect(screen.queryByLabelText("cancel_order")).toBeNull()
  })

  it("invokes onViewDetail with the order from the eye button", () => {
    const onViewDetail = vi.fn()
    const order = makeOrder()

    renderCard(order, { onViewDetail })

    fireEvent.click(screen.getByLabelText("view_details"))
    expect(onViewDetail).toHaveBeenCalledWith(order)
  })

  it("toggles the expandable panel and renders the detail data", () => {
    mockDetailQuery(makeDetail())

    renderCard(makeOrder())

    const toggle = screen.getByLabelText("expand_order")
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(toggle)

    expect(screen.getByLabelText("collapse_order")).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("María Pérez")).toBeInTheDocument()
    expect(screen.getByText("2 × Hamburguesa Doble")).toBeInTheDocument()
    expect(screen.getByText("Sin cilantro")).toBeInTheDocument()
    expect(screen.getByText("pending_outbound_sync")).toBeInTheDocument()
  })

  it("marks the time amber when a Pending order breaches the 30-minute SLA", () => {
    const { container } = renderCard(
      makeOrder({
        statusCode: "Pending",
        externalCreatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      })
    )

    const time = container.querySelector<HTMLTimeElement>("time")
    expect(time).not.toBeNull()
    expect(time).toHaveClass("text-amber-500")
  })

  it("keeps the time muted for a recent Pending order", () => {
    const { container } = renderCard(
      makeOrder({
        statusCode: "Pending",
        externalCreatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      })
    )

    const time = container.querySelector<HTMLTimeElement>("time")
    expect(time).not.toBeNull()
    expect(time).toHaveClass("text-muted-foreground")
    expect(time).not.toHaveClass("text-amber-500")
  })

  it("enables the detail query when the card is priority", () => {
    renderCard(makeOrder(), { priority: true })

    expect(mockedUseOrderDetail).toHaveBeenCalledWith("ord-1", true)
  })

  it("keeps the detail query disabled before hover/expand for non-priority cards", () => {
    renderCard(makeOrder(), { priority: false })

    expect(mockedUseOrderDetail).toHaveBeenCalledWith("ord-1", false)
  })
})
