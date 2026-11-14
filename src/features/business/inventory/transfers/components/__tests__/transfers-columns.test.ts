import type { ReactElement, ReactNode } from "react"
import { isValidElement } from "react"
import { describe, expect, it, vi } from "vitest"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TransferSummaryDto } from "../../../types/purchasing"
import { TRANSFER_STATUS_TONE } from "../../../utils/status"
import { buildTransferColumns } from "../transfers-columns"

const t = (key: string) => key

type BadgeElementProps = { tone?: string; children?: ReactNode }
type ButtonElementProps = { children?: ReactNode; onClick?: () => void }
type CellElementProps = { children?: ReactNode }

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

function cellChildren(node: ReactNode): ReactNode[] {
  const cell = node as ReactElement<CellElementProps>
  return Array.isArray(cell.props.children) ? cell.props.children : [cell.props.children]
}

const transfer: TransferSummaryDto = {
  id: "transfer-1",
  number: "T-55",
  fromBranchId: "branch-1",
  fromBranchName: "Sede Medellín",
  toBranchId: "branch-2",
  toBranchName: "Sede Bogotá",
  purchaseOrderId: "order-1",
  purchaseOrderNumber: "OC-1042",
  status: "InTransit",
  lineCount: 3,
  totalValue: 90000,
  pendingDifferences: 0,
  dispatchedAt: "2026-10-01T09:00:00.000Z",
  receivedAt: null,
}

describe("buildTransferColumns", () => {
  const build = (onOpen = vi.fn()) => buildTransferColumns(t, { onOpen })

  it("returns the expected keys and headers", () => {
    const columns = build()
    expect(columns.map((column) => column.key)).toEqual([
      "document",
      "route",
      "date",
      "products",
      "total",
      "status",
      "actions",
    ])
    expect(columns.map((column) => column.header)).toEqual([
      "document",
      "transfers_route",
      "date",
      "order_products",
      "value",
      "status",
      "actions",
    ])
  })

  it("renders the document with its request sublabel", () => {
    const [number, sublabel] = cellChildren(columnOf<TransferSummaryDto>(build(), "document").render(transfer))
    expect((number as ReactElement<CellElementProps>).props.children).toBe("T-55")
    expect((sublabel as ReactElement<CellElementProps>).props.children).toBe("transfers_for_order")

    const [, withoutOrderSublabel] = cellChildren(
      columnOf<TransferSummaryDto>(build(), "document").render({ ...transfer, purchaseOrderNumber: null })
    )
    expect((withoutOrderSublabel as ReactElement<CellElementProps>).props.children).toBe("transfers_without_order")
  })

  it("renders the route from → to", () => {
    const [from, , to] = cellChildren(columnOf<TransferSummaryDto>(build(), "route").render(transfer))
    expect(from).toBe("Sede Medellín")
    expect(to).toBe("Sede Bogotá")
  })

  it("renders the status badge with the tone from TRANSFER_STATUS_TONE", () => {
    const [statusBadge] = cellChildren(
      columnOf<TransferSummaryDto>(build(), "status").render(transfer)
    ) as ReactElement<BadgeElementProps>[]
    expect(statusBadge.type).toBe(Badge)
    expect(statusBadge.props.tone).toBe(TRANSFER_STATUS_TONE.InTransit)
    expect(statusBadge.props.children).toBe("transfer_status_InTransit")

    const [, warningBadge] = cellChildren(
      columnOf<TransferSummaryDto>(build(), "status").render({ ...transfer, pendingDifferences: 2 })
    ) as ReactElement<BadgeElementProps>[]
    expect(warningBadge.type).toBe(Badge)
    expect(warningBadge.props.tone).toBe("warning")
    expect(warningBadge.props.children).toBe("transfer_pending_differences")
  })

  it("opens the transfer from the actions button", () => {
    const onOpen = vi.fn()
    const button = findButton(columnOf<TransferSummaryDto>(build(onOpen), "actions").render(transfer))
    expect(button).toBeDefined()
    expect(button?.props.children).toContain("po_detail")
    button?.props.onClick?.()
    expect(onOpen).toHaveBeenCalledWith(transfer)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
