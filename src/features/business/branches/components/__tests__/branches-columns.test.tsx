/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { Branch } from "../../types"
import { buildBranchColumns } from "../branches-columns"

const branch = (overrides: Partial<Branch> = {}): Branch => ({
  id: "b1",
  name: "Sede Medellín",
  identification: "901",
  address: "Calle 1",
  phone: "300",
  email: "a@b.co",
  isActive: true,
  adminUserId: "u1",
  adminUserName: "Ana",
  createdAt: "2026-11-18T00:00:00Z",
  isSupplier: false,
  latitude: "",
  longitude: "",
  ...overrides,
})

function renderActions(b: Branch, isMutating = false) {
  const handlers = { onConfigure: vi.fn(), onRequestAction: vi.fn() }
  const columns = buildBranchColumns((key) => key, { isMutating, ...handlers })
  const actions = columns.find((column) => column.key === "actions")!
  render(<div>{actions.render(b)}</div>)
  return handlers
}

describe("branch row actions", () => {
  it("shows each action as a button with its own word, no menu and no duplicate of Configure", () => {
    renderActions(branch())
    expect(screen.queryByRole("button", { name: "edit" })).toBeNull()
    expect(screen.getByRole("button", { name: "configure" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "deactivate" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "more_actions" })).toBeNull()
  })

  it("routes each button to its handler", () => {
    const b = branch()
    const handlers = renderActions(b)
    fireEvent.click(screen.getByRole("button", { name: "configure" }))
    fireEvent.click(screen.getByRole("button", { name: "deactivate" }))
    expect(handlers.onConfigure).toHaveBeenCalledWith(b)
    expect(handlers.onRequestAction).toHaveBeenCalledWith(b, "deactivate")
  })

  it("offers to activate an inactive branch", () => {
    const b = branch({ isActive: false })
    const handlers = renderActions(b)
    fireEvent.click(screen.getByRole("button", { name: "activate" }))
    expect(handlers.onRequestAction).toHaveBeenCalledWith(b, "activate")
  })

  it("disables the buttons while a mutation is running", () => {
    renderActions(branch(), true)
    for (const name of ["configure", "deactivate"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled()
    }
  })
})
