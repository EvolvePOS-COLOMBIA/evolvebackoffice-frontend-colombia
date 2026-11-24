/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { DeliverOrderDialog } from "../deliver-order-dialog"
import type { DeliverableOrder } from "../../types"

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "es" } }),
}))

const { deliverMutate } = vi.hoisted(() => ({ deliverMutate: vi.fn() }))

vi.mock("../../hooks/use-delivery", () => ({
  useDeliverOrder: () => ({ mutate: deliverMutate, isPending: false }),
}))

vi.mock("@/features/business/orders/hooks/use-orders", () => ({
  useOrderDetail: () => ({ data: { total: 136000 }, isLoading: false }),
}))

vi.mock("@/features/business/payment-methods/services/payment-methods.service", () => ({
  getActivePaymentMethods: () =>
    Promise.resolve([{ code: "CASH", name: "Efectivo", isCash: true, requiresReference: false }]),
}))

const ORDER: DeliverableOrder = { id: "order-1", externalOrderId: null, total: 136000 }

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <DeliverOrderDialog open onOpenChange={vi.fn()} order={ORDER} advanceMode={0} />
    </QueryClientProvider>
  )
}

describe("DeliverOrderDialog money fields (EC-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("preloads the payment amount with the order total, formatted", async () => {
    renderDialog()
    expect(((await screen.findByDisplayValue("136.000")) as HTMLInputElement).value).toBe("136.000")
  })

  it("sends the payment amount as a plain number", async () => {
    renderDialog()
    await screen.findByDisplayValue("136.000")

    fireEvent.click(screen.getByText("deliver_confirm"))

    const payload = deliverMutate.mock.calls[0][0].payload
    expect(payload.payments[0].amount).toBe(136000)
  })

  it("keeps validating that the payments add up to the total", async () => {
    renderDialog()
    const amount = (await screen.findByDisplayValue("136.000")) as HTMLInputElement

    fireEvent.change(amount, { target: { value: "100000" } })
    expect(amount.value).toBe("100.000")
    fireEvent.click(screen.getByText("deliver_confirm"))

    expect(deliverMutate).not.toHaveBeenCalled()
    expect(screen.getByText("deliver_sum_mismatch")).toBeInTheDocument()
  })

  it("formats the refund amount and sends it as a plain number", async () => {
    renderDialog()
    await screen.findByDisplayValue("136.000")

    fireEvent.click(screen.getByRole("checkbox"))
    const refund = screen.getAllByPlaceholderText("0").pop() as HTMLInputElement
    fireEvent.change(refund, { target: { value: "15000" } })
    expect(refund.value).toBe("15.000")

    fireEvent.click(screen.getByText("deliver_confirm"))

    const payload = deliverMutate.mock.calls[0][0].payload
    expect(payload.returnAdvance).toBe(true)
    expect(payload.advanceRefundAmount).toBe(15000)
  })
})
