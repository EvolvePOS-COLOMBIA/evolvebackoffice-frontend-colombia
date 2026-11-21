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

const { createMutate, PAYMENT_METHODS } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  PAYMENT_METHODS: [
    { code: "TARJETA_CREDITO", name: "Tarjeta Crédito", isCash: false },
    { code: "EFFECTIVO", name: "Efectivo", isCash: true },
  ],
}))

// Único useQuery del diálogo: el catálogo de medios de pago activos.
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ data: PAYMENT_METHODS, isLoading: false }),
}))

vi.mock("../../hooks/use-orders", () => ({
  useCreateManualOrder: () => ({ mutate: createMutate, isPending: false }),
}))

vi.mock("../../hooks/use-print-comanda", () => ({
  usePrintComanda: () => ({
    printComanda: vi.fn(),
    printCustomerReceipt: vi.fn(),
    isPrinting: false,
    isConfigured: false,
    isCustomerReceiptConfigured: false,
    autoPrintEnabled: false,
    customerReceiptAutoPrintEnabled: false,
  }),
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

/** The picker stays open (and aria-hidden-s the rest), so find the button by its footer slot. */
function submitOrder() {
  const footer = document.querySelector("[data-slot=order-footer]") as HTMLElement
  fireEvent.click(within(footer).getByText("create_order"))
}

describe("ManualOrderDialog money fields (EC-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseBranchItems.mockReturnValue({
      data: { data: ITEMS },
      isLoading: false,
    } as unknown as BranchItemsResult)
  })

  it("shows the unit price with thousands separators and formats while typing", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)
    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    const price = screen.getByLabelText(/unit_price_of/) as HTMLInputElement
    expect(price.value).toBe("1.000")

    fireEvent.change(price, { target: { value: "12500" } })
    expect(price.value).toBe("12.500")
    expect(screen.getByText(/price_modified/)).toBeInTheDocument()
  })

  it("formats the shipping cost while typing", () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)

    const shipping = screen.getByLabelText("shipping_cost") as HTMLInputElement
    fireEvent.change(shipping, { target: { value: "5000" } })

    expect(shipping.value).toBe("5.000")
  })

  it("still sends plain numbers to the API", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)
    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    fireEvent.change(screen.getByLabelText(/unit_price_of/), { target: { value: "12500" } })
    fireEvent.change(screen.getByLabelText("shipping_cost"), { target: { value: "5000" } })
    submitOrder()

    expect(createMutate).toHaveBeenCalledTimes(1)
    const payload = createMutate.mock.calls[0][0]
    expect(payload.shippingCost).toBe(5000)
    expect(payload.items[0].unitPriceOverride).toBe(12500)
  })

  it("sends the tenant's cash payment code by default, not a hardcoded one", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)
    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    submitOrder()

    expect(createMutate.mock.calls[0][0].paymentMethod).toBe("EFFECTIVO")
  })

  it("sends no shipping cost when the field is left empty", async () => {
    render(<ManualOrderDialog open onOpenChange={vi.fn()} branchId="branch-1" />)
    openPicker()
    await screen.findByText("Producto 0")
    addFromPicker("Producto 0")

    submitOrder()

    expect(createMutate.mock.calls[0][0].shippingCost).toBeNull()
  })
})
