import type { ReactElement, ReactNode } from "react"
import { isValidElement } from "react"
import { describe, expect, it, vi } from "vitest"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GoodsReceiptDto, PurchaseOrderSummaryDto } from "../../../types/purchasing"
import { ORDER_STATUS_TONE } from "../../../utils/status"
import { buildOrderColumns, buildReceiptColumns } from "../purchase-orders-columns"

const t = (key: string) => key

type BadgeElementProps = { tone?: string; children?: ReactNode }
type ButtonElementProps = { children?: ReactNode; onClick?: () => void }

/** Walks the rendered cell and returns the first Button element it finds. */
function findButton(node: ReactNode): ReactElement<ButtonElementProps> | undefined {
  if (!isValidElement(node)) return undefined
  const element = node as ReactElement<ButtonElementProps>
  if (element.type === Button) return element
  const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children]
  for (const child of children) {
    const match = findButton(child)
    if (match) return match
  }
  return undefined
}

function columnOf<T>(columns: ColumnDef<T>[], key: string): ColumnDef<T> {
  const column = columns.find((entry) => entry.key === key)
  if (!column) throw new Error(`missing column "${key}"`)
  return column
}

const order: PurchaseOrderSummaryDto = {
  id: "order-1",
  number: "OC-1042",
  branchId: "branch-1",
  branchName: "Main branch",
  supplierBranchId: null,
  supplierId: "supplier-1",
  supplierName: "Acme Supplies",
  status: "Sent",
  lineCount: 4,
  estimatedTotal: 125000,
  createdAt: "2026-10-01T08:00:00.000Z",
  sentAt: "2026-10-01T09:00:00.000Z",
  expectedDate: null,
}

const receipt: GoodsReceiptDto = {
  id: "receipt-1",
  number: "E-204",
  branchId: "branch-1",
  branchName: "Main branch",
  supplierId: "supplier-1",
  supplierName: "Acme Supplies",
  purchaseOrderId: "order-1",
  purchaseOrderNumber: "OC-1042",
  invoiceNumber: "F-991",
  status: "Applied",
  notes: null,
  createdAt: "2026-10-02T10:00:00.000Z",
  createdBy: null,
  total: 45000,
  lines: [],
}

describe("buildOrderColumns", () => {
  const build = (onOpen = vi.fn()) =>
    buildOrderColumns(t, { counterpartLabel: "Supplier", counterpart: "supplier", onOpen })

  it("returns the expected keys and headers", () => {
    const columns = build()
    expect(columns.map((column) => column.key)).toEqual([
      "document",
      "counterpart",
      "date",
      "products",
      "total",
      "status",
      "actions",
    ])
    expect(columns.map((column) => column.header)).toEqual([
      "document",
      "Supplier",
      "date",
      "order_products",
      "value",
      "status",
      "actions",
    ])
  })

  it("renders the status badge with the tone from ORDER_STATUS_TONE", () => {
    const sent = columnOf<PurchaseOrderSummaryDto>(build(), "status").render(order) as ReactElement<BadgeElementProps>
    expect(sent.type).toBe(Badge)
    expect(sent.props.tone).toBe(ORDER_STATUS_TONE.Sent)
    expect(sent.props.children).toBe("order_status_Sent")

    const cancelled = columnOf<PurchaseOrderSummaryDto>(build(), "status").render({
      ...order,
      status: "Cancelled",
    }) as ReactElement<BadgeElementProps>
    expect(cancelled.props.tone).toBe(ORDER_STATUS_TONE.Cancelled)
    expect(cancelled.props.children).toBe("order_status_Cancelled")
  })

  it("renders the counterpart from the supplier or the branch", () => {
    const supplier = columnOf<PurchaseOrderSummaryDto>(build(), "counterpart").render(order)
    expect(supplier).toBe("Acme Supplies")

    const branchColumns = buildOrderColumns(t, {
      counterpartLabel: "Branch",
      counterpart: "branch",
      onOpen: vi.fn(),
    })
    const branch = columnOf<PurchaseOrderSummaryDto>(branchColumns, "counterpart").render(order)
    expect(branch).toBe("Main branch")
  })

  it("renders the document as plain text and opens the order from the actions button", () => {
    const onOpen = vi.fn()
    const columns = build(onOpen)

    const documentCell = columnOf<PurchaseOrderSummaryDto>(columns, "document").render(order) as ReactElement<{
      children?: ReactNode
    }>
    expect(documentCell.props.children).toBe("OC-1042")

    const actionsButton = findButton(columnOf<PurchaseOrderSummaryDto>(columns, "actions").render(order))
    expect(actionsButton).toBeDefined()
    expect(actionsButton?.props.children).toContain("po_detail")
    actionsButton?.props.onClick?.()
    expect(onOpen).toHaveBeenCalledWith(order)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})

describe("buildReceiptColumns", () => {
  const build = (onVoid = vi.fn()) => buildReceiptColumns(t, { onVoid })

  it("returns the expected keys and headers", () => {
    const columns = build()
    expect(columns.map((column) => column.key)).toEqual(["document", "supplier", "invoice", "date", "total", "actions"])
    expect(columns.map((column) => column.header)).toEqual([
      "document",
      "receipt_supplier",
      "receive_invoice",
      "date",
      "value",
      "actions",
    ])
  })

  it("renders the Voided badge instead of the void button", () => {
    const voided = columnOf<GoodsReceiptDto>(build(), "actions").render({
      ...receipt,
      status: "Voided",
    }) as ReactElement<BadgeElementProps>
    expect(voided.type).toBe(Badge)
    expect(voided.props.tone).toBe("danger")
    expect(voided.props.children).toBe("receipt_voided")
  })

  it("renders the void button and calls onVoid", () => {
    const onVoid = vi.fn()
    const button = findButton(columnOf<GoodsReceiptDto>(build(onVoid), "actions").render(receipt))
    expect(button).toBeDefined()
    expect(button?.props.children).toContain("void")
    button?.props.onClick?.()
    expect(onVoid).toHaveBeenCalledWith(receipt)
  })

  it("renders an em dash when the invoice number is missing", () => {
    const invoice = columnOf<GoodsReceiptDto>(build(), "invoice").render({
      ...receipt,
      invoiceNumber: null,
    }) as ReactElement<{ children?: ReactNode }>
    expect(invoice.props.children).toBe("—")

    const withInvoice = columnOf<GoodsReceiptDto>(build(), "invoice").render(receipt) as ReactElement<{
      children?: ReactNode
    }>
    expect(withInvoice.props.children).toBe("F-991")
  })
})
