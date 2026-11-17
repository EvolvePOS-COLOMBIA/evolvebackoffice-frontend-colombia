import { describe, expect, it } from "vitest"

import type { PurchaseOrderSummaryDto, TransferSummaryDto } from "../../../types/purchasing"
import { filterTransferOrders, filterTransfers } from "../search"

const order = (overrides: Partial<PurchaseOrderSummaryDto> = {}): PurchaseOrderSummaryDto => ({
  id: "order-1",
  number: "OC-1042",
  branchId: "branch-1",
  branchName: "Sede Medellín",
  supplierBranchId: null,
  supplierId: null,
  supplierName: "Sede Bogotá",
  status: "Sent",
  lineCount: 4,
  estimatedTotal: 125000,
  createdAt: "2026-10-01T08:00:00.000Z",
  sentAt: null,
  expectedDate: null,
  ...overrides,
})

const transfer = (overrides: Partial<TransferSummaryDto> = {}): TransferSummaryDto => ({
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
  ...overrides,
})

describe("filterTransferOrders", () => {
  const items = [
    order({ id: "order-1", number: "OC-1042", supplierName: "Sede Bogotá" }),
    order({ id: "order-2", number: "OC-2001", supplierName: "Carlos Bolaño" }),
  ]

  it("returns every item when the search is empty or whitespace", () => {
    expect(filterTransferOrders(items, "")).toEqual(items)
    expect(filterTransferOrders(items, "   ")).toEqual(items)
  })

  it("matches by order number, ignoring case", () => {
    expect(filterTransferOrders(items, "oc-1042").map((item) => item.id)).toEqual(["order-1"])
    expect(filterTransferOrders(items, "2001").map((item) => item.id)).toEqual(["order-2"])
  })

  it("matches by counterpart branch, ignoring case and accents", () => {
    expect(filterTransferOrders(items, "sede bogota").map((item) => item.id)).toEqual(["order-1"])
    expect(filterTransferOrders(items, "BOGOTÁ").map((item) => item.id)).toEqual(["order-1"])
    expect(filterTransferOrders(items, "bolaño").map((item) => item.id)).toEqual(["order-2"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterTransferOrders(items, "sucursal inexistente")).toEqual([])
  })
})

describe("filterTransfers", () => {
  const items = [
    transfer({ id: "transfer-1", number: "T-55", purchaseOrderNumber: "OC-1042" }),
    transfer({
      id: "transfer-2",
      number: "T-56",
      fromBranchName: "Carlos Bolaño",
      toBranchName: "Sede Medellín",
      purchaseOrderNumber: null,
    }),
  ]

  it("returns every item when the search is empty or whitespace", () => {
    expect(filterTransfers(items, "")).toEqual(items)
    expect(filterTransfers(items, "   ")).toEqual(items)
  })

  it("matches by transfer number, route branches and purchase order number", () => {
    expect(filterTransfers(items, "t-55").map((item) => item.id)).toEqual(["transfer-1"])
    expect(filterTransfers(items, "bogota").map((item) => item.id)).toEqual(["transfer-1"])
    expect(filterTransfers(items, "carlos bolaño").map((item) => item.id)).toEqual(["transfer-2"])
    expect(filterTransfers(items, "OC-1042").map((item) => item.id)).toEqual(["transfer-1"])
  })

  it("does not throw on rows without an associated purchase order", () => {
    expect(filterTransfers(items, "t-56").map((item) => item.id)).toEqual(["transfer-2"])
    expect(filterTransfers(items, "nada")).toEqual([])
  })
})
