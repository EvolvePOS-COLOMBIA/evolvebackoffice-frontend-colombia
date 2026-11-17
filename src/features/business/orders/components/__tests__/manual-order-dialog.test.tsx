/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ManualOrderDialog } from "../manual-order-dialog"
import { useBranchItems } from "@/features/business/items/catalog/hooks/use-branch-items"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) => (opts ? `${key}:${JSON.stringify(opts)}` : key),
    i18n: { language: "es" },
  }),
}))

vi.mock("@/features/business/items/catalog/hooks/use-branch-items", () => ({
  useBranchItems: vi.fn(),
}))

vi.mock("../../hooks/use-orders", () => ({
  useCreateManualOrder: () => ({ mutate: vi.fn(), isPending: false }),
}))

const mockedUseBranchItems = vi.mocked(useBranchItems)
type BranchItemsResult = ReturnType<typeof useBranchItems>

const ITEMS = Array.from({ length: 30 }, (_, index) => ({
  itemPublicId: `item-${index}`,
  itemName: `Producto ${index}`,
  itemSku: `SKU-${index}`,
  price: 1000 + index,
  inactive: false,
}))

describe("ManualOrderDialog product picker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseBranchItems.mockReturnValue({
      data: { data: ITEMS },
      isLoading: false,
    } as unknown as BranchItemsResult)
  })

  it("lets the mouse wheel scroll the product list opened inside the dialog (EC-2)", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    fireEvent.click(screen.getByText("select_item_placeholder"))
    const firstProduct = await screen.findByText("Producto 0")
    const list = firstProduct.closest("div.overflow-y-auto") as HTMLElement
    expect(list).not.toBeNull()

    // happy-dom has no layout: give the list real scrollable geometry so the scroll lock
    // can tell "can scroll further" apart from "nothing to scroll".
    list.style.overflowY = "auto"
    Object.defineProperty(list, "scrollHeight", { configurable: true, value: 1000 })
    Object.defineProperty(list, "clientHeight", { configurable: true, value: 256 })

    // The dialog's scroll lock cancels wheel events that originate outside the dialog content
    // (the popover is portaled to <body>), which is what froze the list.
    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true })
    list.dispatchEvent(wheel)

    expect(wheel.defaultPrevented).toBe(false)
  })
})
