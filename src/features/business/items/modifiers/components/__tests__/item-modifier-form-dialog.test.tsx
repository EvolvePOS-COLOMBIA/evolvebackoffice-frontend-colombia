/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { ItemModifierFormDialog } from "../item-modifier-form-dialog"
import type { ItemModifier, ItemResponseDto } from "../../types"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

const { updateMutate } = vi.hoisted(() => ({ updateMutate: vi.fn() }))

vi.mock("../../hooks/use-modifiers", () => ({
  useCreateItemModifier: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateItemModifier: () => ({ mutate: updateMutate, isPending: false }),
  useModifierGroups: () => ({ data: [], isLoading: false }),
}))

const MODIFIER: ItemModifier = {
  id: "mod-1",
  parentItemId: "parent-1",
  childItemId: "child-1",
  childItemName: "Queso extra",
  childItemSku: "QX",
  modifierGroupId: null,
  modifierGroupName: null,
  modifierTypeCode: "Optional",
  modifierTypeName: null,
  minQuantity: 0,
  maxQuantity: 1,
  extraPrice: 2500,
  sortOrder: 0,
  isActive: true,
}

const ITEMS = [
  { id: "parent-1", name: "Pizza" },
  { id: "child-1", name: "Queso extra" },
] as unknown as ItemResponseDto[]

/** FormControl wraps the field in a div, so the label does not point at the input: find it by value. */
async function renderDialog() {
  render(
    <ItemModifierFormDialog
      open
      onOpenChange={vi.fn()}
      parentItemId="parent-1"
      modifierToEdit={MODIFIER}
      items={ITEMS}
    />
  )
  return (await screen.findByDisplayValue("2.500")) as HTMLInputElement
}

describe("ItemModifierFormDialog extra price (EC-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the saved extra price with thousands separators", async () => {
    const price = await renderDialog()
    expect(price.value).toBe("2.500")
  })

  it("formats while typing and submits a plain number", async () => {
    const price = await renderDialog()

    fireEvent.change(price, { target: { value: "4000" } })
    expect(price.value).toBe("4.000")

    fireEvent.click(screen.getByText("update"))
    await waitFor(() => expect(updateMutate).toHaveBeenCalled())
    expect(updateMutate.mock.calls[0][0].payload.extraPrice).toBe(4000)
  })

  it("submits 0 when the price is cleared", async () => {
    const price = await renderDialog()

    fireEvent.change(price, { target: { value: "" } })
    expect(price.value).toBe("")

    fireEvent.click(screen.getByText("update"))
    await waitFor(() => expect(updateMutate).toHaveBeenCalled())
    expect(updateMutate.mock.calls[0][0].payload.extraPrice).toBe(0)
  })
})
