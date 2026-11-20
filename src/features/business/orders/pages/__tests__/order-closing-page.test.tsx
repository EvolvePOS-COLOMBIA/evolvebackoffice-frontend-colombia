/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"

import type {
  OrderClosing,
  OrderClosingOrderRow,
  OrderClosingPendingDate,
  OrderClosingPreview,
} from "../../types/closing"
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
const resolveMutate = vi.fn()
const refetchPendingDates = vi.fn()
const previewFor = vi.fn()
const closingsData: { current: OrderClosing[] } = { current: [] }
const pendingDatesState: { current: { data?: OrderClosingPendingDate[]; isError: boolean } } = {
  current: { data: [], isError: false },
}

vi.mock("../../hooks/use-order-closings", () => ({
  useOrderClosingPreview: (branchId: string | null, date: string | null = null) => ({
    data: previewFor(branchId, date),
    isLoading: false,
  }),
  usePendingClosingDates: () => ({
    ...pendingDatesState.current,
    refetch: refetchPendingDates,
    isFetching: false,
  }),
  useResolvePendingOrder: () => ({ mutate: resolveMutate, isPending: false }),
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

// Todas con estado final: el día se puede cerrar.
const RESOLVED_ORDERS = [
  order("aaa111", "DELIVERED", 10000, "Ana Pérez"),
  order("ccc333", "CANCELLED", 3000, "Rosa Díaz"),
]

const pendingDay = (date: string): OrderClosingPendingDate => ({
  date,
  windowStartUtc: `${date}T05:00:00Z`,
  windowEndUtc: `${date}T05:00:00Z`,
  ordersCount: 4,
  unresolvedCount: 1,
  totalAmount: 42000,
})

const confirmClose = () => {
  fireEvent.click(screen.getByRole("button", { name: /closing_close_action/ }))
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "closing_confirm_action" }))
}

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
  resolveMutate.mockReset()
  refetchPendingDates.mockReset()
  pendingDatesState.current = { data: [], isError: false }
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

  it("blocks closing while orders are still in progress", () => {
    setup()
    expect(screen.getByRole("button", { name: /closing_close_action/ })).toBeDisabled()
    expect(screen.getByText("closing_blocked")).toBeInTheDocument()
  })

  it("asks for confirmation and then closes the window with the notes", () => {
    previewFor.mockImplementation(() => preview(RESOLVED_ORDERS, 10000))
    setup()
    fireEvent.change(screen.getByLabelText("closing_notes_label"), { target: { value: "Diferencia en caja" } })
    fireEvent.click(screen.getByRole("button", { name: /closing_close_action/ }))

    expect(closeMutate).not.toHaveBeenCalled()
    const dialog = screen.getByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "closing_confirm_action" }))

    expect(closeMutate).toHaveBeenCalledTimes(1)
    expect(closeMutate.mock.calls[0][0]).toEqual({ branchId: "b1", notes: "Diferencia en caja", date: null })
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
    expect(previewFor).toHaveBeenLastCalledWith("b2", null)
  })

  it("sends the date of the previewed period when closing the current shift", () => {
    previewFor.mockImplementation(() => ({ ...preview(RESOLVED_ORDERS, 10000), date: "2026-11-19" }))
    setup()
    confirmClose()
    expect(closeMutate.mock.calls[0][0]).toMatchObject({ branchId: "b1", date: "2026-11-19" })
  })

  it("loads a previous day picked in the pending days picker", () => {
    pendingDatesState.current = { data: [pendingDay("2026-11-17")], isError: false }
    setup()
    fireEvent.click(screen.getByRole("button", { name: /2026-11-17/ }))
    expect(previewFor).toHaveBeenLastCalledWith("b1", "2026-11-17")
    expect(screen.getByRole("button", { name: "current_period" })).toHaveAttribute("aria-pressed", "false")
  })

  it("goes back to the current shift after closing a previous day", () => {
    pendingDatesState.current = { data: [pendingDay("2026-11-17")], isError: false }
    previewFor.mockImplementation((_branchId: string | null, date: string | null) => ({
      ...preview(RESOLVED_ORDERS, 10000),
      date: date ?? "2026-11-19",
    }))
    closeMutate.mockImplementation((_vars: unknown, options?: { onSuccess?: () => void }) => {
      // Tras cerrar, el día ya no figura entre los pendientes.
      pendingDatesState.current = { data: [], isError: false }
      options?.onSuccess?.()
    })
    setup()
    fireEvent.click(screen.getByRole("button", { name: /2026-11-17/ }))
    confirmClose()

    expect(closeMutate.mock.calls[0][0]).toMatchObject({ date: "2026-11-17" })
    expect(previewFor).toHaveBeenLastCalledWith("b1", null)
  })

  it("keeps the picker visible while a previous day is selected", () => {
    pendingDatesState.current = { data: [pendingDay("2026-11-17")], isError: false }
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <OrderClosingPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: /2026-11-17/ }))
    pendingDatesState.current = { data: [], isError: false }
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <OrderClosingPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByRole("button", { name: "current_period" })).toBeInTheDocument()
  })

  it("shows an error with retry when the pending days cannot be loaded", () => {
    pendingDatesState.current = { data: undefined, isError: true }
    setup()
    expect(screen.getByText("pending_days_error")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "pending_days_retry" }))
    expect(refetchPendingDates).toHaveBeenCalledTimes(1)
  })

  it("marks an open order as delivered after confirming", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: "resolve_delivered" }))
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "resolve_delivered" }))
    expect(resolveMutate).toHaveBeenCalledTimes(1)
    expect(resolveMutate.mock.calls[0][0]).toMatchObject({ orderId: "bbb222", outcome: "delivered" })
  })

  it("cancels an open order with the closing reason", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: "resolve_cancel" }))
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "resolve_cancel" }))
    expect(resolveMutate.mock.calls[0][0]).toEqual({
      orderId: "bbb222",
      outcome: "cancelled",
      reason: "resolve_cancel_reason",
    })
  })

  it("offers resolve actions only on orders still in progress", () => {
    setup()
    expect(screen.getAllByRole("button", { name: "resolve_delivered" })).toHaveLength(1)
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
