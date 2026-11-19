/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"

import { ActiveOrdersCard } from "../active-orders-card"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

vi.mock("@/features/business/orders/components/order-detail-dialog", () => ({
  OrderDetailDialog: ({ open, order, onEdit }: { open: boolean; order: { id: string } | null; onEdit?: () => void }) =>
    open && order ? (
      <div data-testid="detail">
        detail:{order.id}
        <button onClick={onEdit}>edit</button>
      </div>
    ) : null,
}))

vi.mock("@/features/business/orders/components/edit-order-dialog", () => ({
  EditOrderDialog: ({ open, orderId }: { open: boolean; orderId: string | null }) =>
    open ? <div data-testid="edit">edit:{orderId}</div> : null,
}))

const order = (id: string, status = "Confirmed") => ({
  id,
  branchId: "b1",
  branchName: "Sede Bogotá",
  customerName: `Cliente ${id}`,
  phone: "",
  items: ["COCA-COLA", "PAPAS", "AGUA"],
  itemCount: 3,
  total: 9000,
  createdAt: "07/11/2026 10:59",
  estimatedDelivery: "",
  status,
  progress: 50,
  address: "",
  paymentMethod: "CASH",
})

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function setup(orders = [order("a"), order("b", "Pending")]) {
  render(
    <MemoryRouter initialEntries={["/business/dashboard"]}>
      <Routes>
        <Route path="*" element={<ActiveOrdersCard orders={orders} />} />
      </Routes>
      <Where />
    </MemoryRouter>
  )
}

describe("ActiveOrdersCard", () => {
  it("'Ver todas' goes to the orders page", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /view_all/ }))
    expect(screen.getByTestId("where")).toHaveTextContent("/business/orders")
  })

  it("opens the order detail dialog when a row is clicked", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /Cliente a/ }))
    expect(screen.getByTestId("detail")).toHaveTextContent("detail:a")
  })

  it("opens the row with the keyboard", () => {
    setup()
    fireEvent.keyDown(screen.getByRole("button", { name: /Cliente b/ }), { key: "Enter" })
    expect(screen.getByTestId("detail")).toHaveTextContent("detail:b")
  })

  it("'Edit' in the detail opens the edit dialog for that order", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /Cliente a/ }))
    fireEvent.click(screen.getByText("edit"))
    expect(screen.getByTestId("edit")).toHaveTextContent("edit:a")
  })

  it("exposes the order progress as a labelled progress bar", () => {
    setup([order("a")])
    const bar = screen.getByRole("progressbar", { name: "order_progress" })
    expect(bar).toHaveAttribute("aria-valuenow", "50")
    expect(bar).toHaveAttribute("title", "order_progress: 50%")
  })

  it("shows an empty state when there are no orders", () => {
    setup([])
    expect(screen.getByText("no_active_orders")).toBeInTheDocument()
  })

  it("formats the total with the app currency instead of a raw toFixed", () => {
    setup([order("a")])
    expect(screen.getByText(/9\.000/)).toBeInTheDocument()
    expect(screen.queryByText("$9000.00")).toBeNull()
  })
})
