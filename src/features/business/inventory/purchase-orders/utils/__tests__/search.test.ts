import { describe, expect, it } from "vitest"

import type { GoodsReceiptDto, PurchaseOrderSummaryDto } from "../../../types/purchasing"
import { filterGoodsReceipts, filterPurchaseOrders } from "../search"

const order = (overrides: Partial<PurchaseOrderSummaryDto> = {}): PurchaseOrderSummaryDto => ({
  id: "order-1",
  number: "OC-1042",
  branchId: "branch-1",
  branchName: "Main branch",
  supplierBranchId: null,
  supplierId: "supplier-1",
  supplierName: "Almacén Central",
  status: "Sent",
  lineCount: 4,
  estimatedTotal: 125000,
  createdAt: "2026-10-01T08:00:00.000Z",
  sentAt: null,
  expectedDate: null,
  ...overrides,
})

const receipt = (overrides: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto => ({
  id: "receipt-1",
  number: "E-204",
  branchId: "branch-1",
  branchName: "Main branch",
  supplierId: "supplier-1",
  supplierName: "Almacén Central",
  purchaseOrderId: "order-1",
  purchaseOrderNumber: "OC-1042",
  invoiceNumber: "F-991",
  status: "Applied",
  notes: null,
  createdAt: "2026-10-02T10:00:00.000Z",
  createdBy: null,
  total: 45000,
  lines: [],
  ...overrides,
})

describe("filterPurchaseOrders", () => {
  const items = [
    order({ id: "order-1", number: "OC-1042", supplierName: "Almacén Central" }),
    order({ id: "order-2", number: "OC-2001", supplierName: "Distribuciones El Río" }),
  ]

  it("returns every item when the search is empty or whitespace", () => {
    expect(filterPurchaseOrders(items, "")).toEqual(items)
    expect(filterPurchaseOrders(items, "   ")).toEqual(items)
  })

  it("matches by order number, ignoring case", () => {
    expect(filterPurchaseOrders(items, "oc-1042").map((item) => item.id)).toEqual(["order-1"])
    expect(filterPurchaseOrders(items, "2001").map((item) => item.id)).toEqual(["order-2"])
  })

  it("matches by supplier, ignoring case and accents", () => {
    expect(filterPurchaseOrders(items, "almacen central").map((item) => item.id)).toEqual(["order-1"])
    expect(filterPurchaseOrders(items, "ALMACÉN").map((item) => item.id)).toEqual(["order-1"])
    expect(filterPurchaseOrders(items, "el rio").map((item) => item.id)).toEqual(["order-2"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterPurchaseOrders(items, "proveedor inexistente")).toEqual([])
  })
})

describe("filterGoodsReceipts", () => {
  const items = [
    receipt({ id: "receipt-1", number: "E-204", invoiceNumber: "F-991", purchaseOrderNumber: "OC-1042" }),
    receipt({
      id: "receipt-2",
      number: "E-305",
      supplierName: "Distribuciones El Río",
      invoiceNumber: null,
      purchaseOrderNumber: null,
    }),
  ]

  it("returns every item when the search is empty or whitespace", () => {
    expect(filterGoodsReceipts(items, "")).toEqual(items)
    expect(filterGoodsReceipts(items, "   ")).toEqual(items)
  })

  it("matches by receipt number, supplier, invoice and purchase order number", () => {
    expect(filterGoodsReceipts(items, "e-305").map((item) => item.id)).toEqual(["receipt-2"])
    expect(filterGoodsReceipts(items, "almacen").map((item) => item.id)).toEqual(["receipt-1"])
    expect(filterGoodsReceipts(items, "f-991").map((item) => item.id)).toEqual(["receipt-1"])
    expect(filterGoodsReceipts(items, "OC-1042").map((item) => item.id)).toEqual(["receipt-1"])
  })

  it("does not throw on rows with null supplier, invoice or order number", () => {
    expect(filterGoodsReceipts(items, "el rio").map((item) => item.id)).toEqual(["receipt-2"])
    expect(filterGoodsReceipts(items, "nada")).toEqual([])
  })
})
