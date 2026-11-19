/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"

import type { OrderClosing, OrderClosingOrderRow, OrderClosingPreview } from "../../types/closing"
import { OrderClosingPage } from "../order-closing-page"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}|${Object.values(options).join("|")}` : key,
    i18n: { language: "es" },
  }),
}))

vi.mock("@/features/business/branches/hooks/use-branches", () => ({
  useBranches: () => ({
    data: {
      data: [
        { id: "b1", name: "Sede Medellín", isActive: true },
        { id: "b2", name: "Sede Bogotá", isActive: true },
      ],
    },
  }),
}))

vi.mock("@/features/business/payment-methods/services/payment-methods.service", () => ({
  getActivePaymentMethods: () => Promise.resolve([{ id: "1", code: "CASH", name: "Efectivo" }]),
}))

const closeMutate = vi.fn()
const previewFor = vi.fn()
const closingsData: { current: OrderClosing[] } = { current: [] }

vi.mock("../../hooks/use-order-closings", () => ({
  useOrderClosingPreview: (branchId: string | null) => ({ data: previewFor(branchId), isLoading: false }),
  useOrderClosings: () => ({ data: closingsData.current, isLoading: false }),
  useOrderClosingDetail: () => ({ data: undefined }),
  useCloseOrders: () => ({ mutate: closeMutate, isPending: false }),
  useReconcileOrder: () => ({ mutate: vi.fn(), isPending: false }),
}))

const order = (
  id: string,
  status: string,
  total: number,
  customerName: string | null = null,
  method = "CASH"
): OrderClosingOrderRow => ({
  id,
  reference: `POSCO-${id}00000000`,
  origin: "POSCO",
  status,
  declaredPaymentMethod: method,
  customerName,
  total,
  createdAt: "2026-11-18T10:00:00Z",
  reconciled: false,
  reconcilePaymentMethodCode: null,
  reconciledAt: null,
})

const preview = (orders: OrderClosingOrderRow[], totalAmount: number): OrderClosingPreview => ({
  branchId: "b1",
  branchName: "Sede Medellín",
  window: {
    windowStartUtc: "2026-11-18T05:00:00Z",
    windowEndUtc: "2026-11-19T05:00:00Z",
    windowStartLocal: "2026-11-18T00:00:00",
    windowEndLocal: "2026-11-19T00:00:00",
    openingTime: "00:00:00",
    closingTime: "23:59:59",
    timeZone: "America/Bogota",
  },
  ordersCount: orders.length,
  totalAmount,
  breakdown: [],
  orders,
  alreadyClosedCount: 2,
})

const ORDERS = [
  order("aaa111", "DELIVERED", 10000, "Ana Pérez"),
  order("bbb222", "CONFIRMED", 5000, "Luis Gómez"),
  order("ccc333", "CANCELLED", 3000, "Rosa Díaz"),
]

function setup() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <OrderClosingPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  closeMutate.mockReset()
  previewFor.mockReset()
  previewFor.mockImplementation((branchId: string | null) =>
    branchId === "b1" ? preview(ORDERS, 15000) : preview([], 0)
  )
  closingsData.current = []
})

describe("OrderClosingPage", () => {
  it("shows the window total and the orders that make it up", () => {
    setup()
    expect(screen.getAllByText(/15\.000/).length).toBeGreaterThan(0)
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument()
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument()
  })

  it("keeps cancelled orders out of the count when the total leaves them out", () => {
    setup()
    expect(screen.getByText(/closing_cancelled_excluded\|1/)).toBeInTheDocument()
    expect(screen.getByText(/closing_close_action\|2/)).toBeInTheDocument()
  })

  it("filters the table by status", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /closing_filter_open/ }))
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument()
    expect(screen.queryByText("Ana Pérez")).toBeNull()
  })

  it("searches by customer or order number", () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText("closing_search"), { target: { value: "rosa" } })
    expect(screen.getByText("Rosa Díaz")).toBeInTheDocument()
    expect(screen.queryByText("Ana Pérez")).toBeNull()
  })

  it("warns about orders still in progress and jumps to them", () => {
    setup()
    expect(screen.getByText(/closing_open_title\|1/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "closing_open_show" }))
    expect(screen.queryByText("Ana Pérez")).toBeNull()
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument()
  })

  it("asks for confirmation and then closes the window with the notes", () => {
    setup()
    fireEvent.change(screen.getByLabelText("closing_notes_label"), { target: { value: "Diferencia en caja" } })
    fireEvent.click(screen.getByRole("button", { name: /closing_close_action/ }))

    expect(closeMutate).not.toHaveBeenCalled()
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "closing_confirm_action" }))

    expect(closeMutate).toHaveBeenCalledTimes(1)
    expect(closeMutate.mock.calls[0][0]).toEqual({ branchId: "b1", notes: "Diferencia en caja" })
  })

  it("disables closing when the window has no orders", () => {
    previewFor.mockImplementation(() => preview([], 0))
    setup()
    expect(screen.getByText("closing_empty")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /closing_close_empty/ })).toBeDisabled()
  })

  it("loads the preview of the branch that is picked", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /Sede Bogotá/ }))
    expect(previewFor).toHaveBeenLastCalledWith("b2")
  })

  it("lists the past closings in the history tab", () => {
    closingsData.current = [
      {
        id: "c1",
        branchId: "b1",
        branchName: "Sede Medellín",
        windowStart: "2026-11-17T00:00:00",
        windowEnd: "2026-11-18T00:00:00",
        ordersCount: 12,
        totalAmount: 318500,
        reconciledCount: 8,
        breakdown: [],
        notes: "Cuadre de domingo",
        closedBy: "Joaquin",
        closedAt: "2026-11-18T00:05:00Z",
      },
    ]
    setup()
    fireEvent.click(screen.getByRole("button", { name: /closing_tab_history/ }))
    expect(screen.getByText(/Cuadre de domingo/)).toBeInTheDocument()
    expect(screen.getByText(/8\/12/)).toBeInTheDocument()
  })
})
