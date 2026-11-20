/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { CreditDialog } from "../credit-dialog"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

const { activateMutate, credit } = vi.hoisted(() => ({
  activateMutate: vi.fn(),
  credit: {
    personId: "p-1",
    isActive: true,
    creditLimit: 2500000,
    balance: 0,
    available: 2500000,
    activatedAt: null,
    pinConfigured: true,
    isLocked: false,
    pinAttempts: 0,
    email: "ana@example.com",
  },
}))

vi.mock("../../hooks/use-person-credit", () => ({
  usePersonCredit: () => ({ data: credit, isLoading: false, isError: false, refetch: vi.fn() }),
  useCreditHistory: () => ({ data: { items: [] } }),
  useActivateCredit: () => ({ mutate: activateMutate, isPending: false }),
  useResendCreditPin: () => ({ mutate: vi.fn(), isPending: false }),
}))

/** The limit is preloaded when the dialog goes from closed to open, as it does in the app. */
function renderOpenDialog() {
  const ui = (open: boolean) => <CreditDialog open={open} onOpenChange={vi.fn()} personId="p-1" personName="Ana" />
  const { rerender } = render(ui(false))
  rerender(ui(true))
  return screen.getByLabelText("limit_input") as HTMLInputElement
}

describe("CreditDialog limit (EC-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads the current limit with thousands separators", () => {
    expect(renderOpenDialog().value).toBe("2.500.000")
  })

  it("formats while typing and saves a plain number", () => {
    const limit = renderOpenDialog()

    fireEvent.change(limit, { target: { value: "3000000" } })
    expect(limit.value).toBe("3.000.000")

    fireEvent.click(screen.getByText("save_limit"))
    expect(activateMutate.mock.calls[0][0]).toBe(3000000)
  })

  it("does not save an empty limit", () => {
    const limit = renderOpenDialog()

    fireEvent.change(limit, { target: { value: "" } })
    fireEvent.click(screen.getByText("save_limit"))

    expect(activateMutate).not.toHaveBeenCalled()
  })
})
