/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

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

function openPicker() {
  fireEvent.click(screen.getByText("select_item_placeholder"))
}

function pickerList() {
  return document.querySelector<HTMLElement>("[data-slot=popover-content] .overflow-y-auto")
}

function addFromPicker(name: string) {
  const row = within(pickerList() as HTMLElement)
    .getByText(name)
    .closest("button") as HTMLElement
  fireEvent.click(row)
}

describe("ManualOrderDialog redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseBranchItems.mockReturnValue({
      data: { data: ITEMS },
      isLoading: false,
    } as unknown as BranchItemsResult)
  })

  it("keeps the picker open after adding a product so several can be added in a row", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    expect(pickerList()).not.toBeNull()
    addFromPicker("Producto 1")
    expect(screen.getAllByText("Producto 1").length).toBeGreaterThanOrEqual(2)
  })

  it("marks the products already in the order with their quantity inside the picker", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")
    addFromPicker("Producto 0")

    expect(within(pickerList() as HTMLElement).getByText('in_order:{"count":2}')).toBeInTheDocument()
  })

  it("uses the destructive variant for the remove-line button", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    expect(screen.getByLabelText("remove_line")).toHaveAttribute("data-variant", "destructive")
  })

  it("shows how many products and units the order has in the footer", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")
    addFromPicker("Producto 0")
    addFromPicker("Producto 1")

    const footer = document.querySelector("[data-slot=order-footer]") as HTMLElement
    expect(footer).not.toBeNull()
    expect(footer.textContent).toContain('items_count:{"count":2}')
    expect(footer.textContent).toContain('units_count:{"count":3}')
  })

  it("keeps the money summary inside the products column, not in the footer", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")
    addFromPicker("Producto 0")
    addFromPicker("Producto 1")

    const summary = document.querySelector("[data-slot=order-summary]") as HTMLElement
    const footer = document.querySelector("[data-slot=order-footer]") as HTMLElement
    expect(summary).not.toBeNull()
    expect(footer.contains(summary)).toBe(false)
    expect(within(summary).getByText("subtotal")).toBeInTheDocument()
    expect(within(summary).getByText("total")).toBeInTheDocument()
    // 2 × 1.000 + 1 × 1.001
    expect(summary.textContent).toMatch(/3[.,]001/)
  })

  it("flags a line whose price differs from the list price", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")
    expect(screen.queryByText(/price_modified/)).toBeNull()

    fireEvent.change(screen.getByLabelText(/unit_price_of/), { target: { value: "900" } })

    expect(screen.getByText(/price_modified/)).toBeInTheDocument()
  })
})
