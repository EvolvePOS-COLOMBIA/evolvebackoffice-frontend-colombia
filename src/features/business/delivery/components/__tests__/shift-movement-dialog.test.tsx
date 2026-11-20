/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ShiftMovementDialog } from "../shift-movement-dialog"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

describe("ShiftMovementDialog amount (EC-3)", () => {
  it("formats the amount while typing and confirms with a plain number", () => {
    const onConfirm = vi.fn()
    render(<ShiftMovementDialog open onOpenChange={vi.fn()} kind="extra-base" shift={null} onConfirm={onConfirm} />)

    const amount = screen.getByLabelText("movement_amount_label") as HTMLInputElement
    fireEvent.change(amount, { target: { value: "150000" } })
    expect(amount.value).toBe("150.000")

    fireEvent.click(screen.getByText("movement_confirm_extra"))
    expect(onConfirm).toHaveBeenCalledWith(150000, null)
  })

  it("still rejects an empty amount", () => {
    const onConfirm = vi.fn()
    render(<ShiftMovementDialog open onOpenChange={vi.fn()} kind="pickup" shift={null} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText("movement_confirm_pickup"))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText("movement_amount_invalid")).toBeInTheDocument()
  })
})
