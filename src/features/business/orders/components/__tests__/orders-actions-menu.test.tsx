/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"

import { OrdersActionsMenu } from "../orders-actions-menu"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function setup() {
  render(
    <MemoryRouter initialEntries={["/business/orders"]}>
      <Routes>
        <Route path="*" element={<OrdersActionsMenu />} />
      </Routes>
      <Where />
    </MemoryRouter>
  )
}

const openMenu = () => fireEvent.keyDown(screen.getByRole("button", { name: "more_actions" }), { key: "Enter" })

describe("OrdersActionsMenu", () => {
  it("is a labelled menu button that starts closed", () => {
    setup()
    const trigger = screen.getByRole("button", { name: "more_actions" })
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    expect(screen.queryByRole("menuitem")).toBeNull()
  })

  it("lists the closing option", () => {
    setup()
    openMenu()
    expect(screen.getByRole("menuitem", { name: "closing_entry" })).toBeInTheDocument()
  })

  it("goes to the closing page when the option is chosen", () => {
    setup()
    openMenu()
    fireEvent.click(screen.getByRole("menuitem", { name: "closing_entry" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/business/orders/closing")
  })
})
