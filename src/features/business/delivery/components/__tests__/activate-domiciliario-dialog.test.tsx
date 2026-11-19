/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ActivateDomiciliarioDialog } from "../activate-domiciliario-dialog"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

/** The dialog preloads the default base when it goes from closed to open, as it does in the app. */
function renderDialog(defaultBase: number | null, onConfirm = vi.fn()) {
  const ui = (open: boolean) => (
    <ActivateDomiciliarioDialog
      open={open}
      onOpenChange={vi.fn()}
      domiciliario={null}
      defaultBase={defaultBase}
      onConfirm={onConfirm}
    />
  )
  const { rerender } = render(ui(false))
  rerender(ui(true))
  return { onConfirm, base: screen.getByLabelText("activate_base_label") as HTMLInputElement }
}

describe("ActivateDomiciliarioDialog base (EC-3)", () => {
  it("shows the branch default base with thousands separators", () => {
    const { base } = renderDialog(50000)
    expect(base.value).toBe("50.000")
  })

  it("formats while typing and confirms with a plain number", () => {
    const { base, onConfirm } = renderDialog(null)
    fireEvent.change(base, { target: { value: "120000" } })
    expect(base.value).toBe("120.000")

    fireEvent.click(screen.getByText("activate_confirm"))
    expect(onConfirm).toHaveBeenCalledWith(120000)
  })

  it("confirms with the default base when the field is left as loaded", () => {
    const { onConfirm } = renderDialog(50000)
    fireEvent.click(screen.getByText("activate_confirm"))
    expect(onConfirm).toHaveBeenCalledWith(50000)
  })

  it("requires a base when the branch has none", () => {
    const { onConfirm } = renderDialog(null)
    fireEvent.click(screen.getByText("activate_confirm"))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText("activate_base_required")).toBeInTheDocument()
  })
})
