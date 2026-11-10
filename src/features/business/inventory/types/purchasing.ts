// ─── Pedidos, envíos y entradas de proveedor (backend fase 3) ────────────────

export type PurchaseOrderStatus =
  | "Draft"
  | "Sent"
  | "PartiallyDispatched"
  | "Dispatched"
  | "PartiallyReceived"
  | "Received"
  | "Closed"
  | "Cancelled"

export type TransferStatus = "InTransit" | "Received" | "ReceivedWithDifferences" | "Closed"

export type DifferenceReason = "NotArrived" | "Damaged" | "DispatchError"

export interface LineInput {
  itemId: string
  quantity: number
  packagingId: string | null
}

export interface PurchaseOrderLineDto {
  id: string
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  packagingId: string | null
  packagingName: string | null
  packagingFactor: number | null
  quantityOrdered: number
  quantityDispatched: number
  quantityReceived: number
  unitCost: number
  supplierStock: number | null
  /** Precio de venta de la proveedora por unidad base (null si no tiene). */
  supplierPrice: number | null
  /** Costo promedio de la proveedora por unidad base (base del "+ %" si no hay precio de venta). */
  supplierCost: number | null
}

export interface TransferSummaryDto {
  id: string
  number: string
  fromBranchId: string
  fromBranchName: string
  toBranchId: string
  toBranchName: string
  purchaseOrderId: string | null
  purchaseOrderNumber: string | null
  status: TransferStatus
  lineCount: number
  /** Valor al precio que paga el destino. */
  totalValue: number
  pendingDifferences: number
  dispatchedAt: string
  receivedAt: string | null
}

export interface PurchaseOrderSummaryDto {
  id: string
  number: string
  branchId: string
  branchName: string
  supplierBranchId: string | null
  supplierId: string | null
  supplierName: string
  status: PurchaseOrderStatus
  lineCount: number
  estimatedTotal: number
  createdAt: string
  sentAt: string | null
  expectedDate: string | null
}

export interface PurchaseOrderDto {
  id: string
  number: string
  branchId: string
  branchName: string
  branchPhone: string | null
  supplierBranchId: string | null
  supplierId: string | null
  supplierName: string
  supplierPhone: string | null
  status: PurchaseOrderStatus
  notes: string | null
  createdAt: string
  createdBy: string | null
  sentAt: string | null
  expectedDate: string | null
  estimatedTotal: number
  lines: PurchaseOrderLineDto[]
  transfers: TransferSummaryDto[]
}

/** Línea de un pedido anterior ("Repetir último pedido"). Cantidad en la presentación, si la hay. */
export interface OrderLineTemplateDto {
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  quantity: number
  packagingId: string | null
}

export interface SuggestedLineDto {
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  onHand: number
  inTransit: number
  reorderPoint: number
  restockLevel: number
  suggestedQuantity: number
  packagingId: string | null
  packagingName: string | null
  packagingFactor: number | null
}

export interface CreatePurchaseOrderDto {
  branchId: string
  supplierBranchId: string | null
  supplierId: string | null
  lines: LineInput[]
  notes: string | null
  send: boolean
}

export interface TransferLineDto {
  id: string
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  quantitySent: number
  quantityReceived: number | null
  unitCost: number
  /** Precio que paga el destino por unidad base (= costo si la proveedora no cobra ganancia). */
  unitPrice: number
  differenceReason: DifferenceReason | null
  differenceStatus: "None" | "Pending" | "Lost" | "Returned"
  difference: number
}

export interface TransferDto {
  id: string
  number: string
  fromBranchId: string
  fromBranchName: string
  fromBranchPhone: string | null
  toBranchId: string
  toBranchName: string
  toBranchPhone: string | null
  purchaseOrderId: string | null
  purchaseOrderNumber: string | null
  status: TransferStatus
  notes: string | null
  dispatchedAt: string
  dispatchedBy: string | null
  receivedAt: string | null
  receivedBy: string | null
  /** Costo con el que salió del origen. */
  totalCost: number
  /** Valor al precio que paga el destino; totalValue − totalCost = ganancia del origen. */
  totalValue: number
  lines: TransferLineDto[]
}

export interface GoodsReceiptLineDto {
  itemId: string
  itemName: string
  baseUnit: number
  quantity: number
  unitCost: number
  total: number
}

export interface GoodsReceiptDto {
  id: string
  number: string
  branchId: string
  branchName: string
  supplierId: string | null
  supplierName: string | null
  purchaseOrderId: string | null
  purchaseOrderNumber: string | null
  invoiceNumber: string | null
  status: "Applied" | "Voided"
  notes: string | null
  createdAt: string
  createdBy: string | null
  total: number
  lines: GoodsReceiptLineDto[]
}
