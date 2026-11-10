// ─── Inventario (backend Group B12) ─────────────────────────────────────────

export interface ItemPackagingDto {
  id: string
  name: string
  /** Unidades base por presentación (ej. 25000 g). */
  factor: number
  isDefaultPurchase: boolean
}

export interface SaveItemPackagingDto {
  name: string
  factor: number
  isDefaultPurchase: boolean
}

export interface StockItemDto {
  branchItemId: string
  itemId: string
  itemName: string
  sku: string | null
  departmentName: string | null
  baseUnit: number
  isSellable: boolean
  quantity: number
  cost: number
  value: number
  reorderPoint: number
  restockLevel: number
  isBelowMin: boolean
  lastCounted: string | null
  defaultPackaging: ItemPackagingDto | null
}

export type MovementType =
  | "PurchaseReceipt"
  | "TransferOut"
  | "TransferIn"
  | "TransferReturn"
  | "TransferLoss"
  | "ProductionOutput"
  | "ProductionConsumption"
  | "SaleConsumption"
  | "Waste"
  | "CountAdjustment"
  | "Reversal"

export interface InventoryMovementDto {
  id: string
  occurredAt: string
  itemId: string
  itemName: string
  baseUnit: number
  type: MovementType
  quantity: number
  unitCost: number
  totalCost: number
  balanceAfter: number
  documentType: string
  documentId: string
  documentNumber: string | null
  reason: string | null
  notes: string | null
  soldItemName: string | null
  createdBy: string | null
  /** Ya fue anulado por otro movimiento. */
  isReversed: boolean
}

export const MOVEMENT_TYPES: MovementType[] = [
  "PurchaseReceipt",
  "TransferIn",
  "TransferOut",
  "TransferReturn",
  "TransferLoss",
  "ProductionOutput",
  "ProductionConsumption",
  "SaleConsumption",
  "Waste",
  "CountAdjustment",
  "Reversal",
]

/** Documento que originó el movimiento (InventoryDocumentType). */
export const MOVEMENT_DOCUMENT_TYPES = [
  "StockAdjustment",
  "Order",
  "Transaction",
  "PurchaseReceipt",
  "Transfer",
  "Production",
  "WholesaleSale",
] as const

/** Motivo del movimiento (InventoryReason). */
export const MOVEMENT_REASONS = [
  "Waste",
  "Expired",
  "InternalUse",
  "Consumable",
  "CancelledAfterReady",
  "CancelledWhilePreparing",
  "InitialBalance",
  "Correction",
] as const

/** Filtros del historial; todos opcionales. Fechas ISO (UTC), cantidades y costos sin signo. */
export interface MovementFilters {
  search?: string
  from?: string
  to?: string
  type?: string
  documentType?: string
  documentNumber?: string
  reason?: string
  direction?: "in" | "out"
  notes?: string
  createdBy?: string
  reversed?: boolean
  minQuantity?: number
  maxQuantity?: number
  minUnitCost?: number
  maxUnitCost?: number
  minTotalCost?: number
  maxTotalCost?: number
}

export type WriteoffReason = "Waste" | "Expired" | "InternalUse" | "Consumable"

export interface CreateWriteoffDto {
  branchId: string
  reason: WriteoffReason
  notes: string | null
  lines: { itemId: string; quantity: number; packagingId: string | null }[]
}

export interface SetStockQuantityDto {
  branchId: string
  itemId: string
  quantity: number
  notes: string | null
}

export interface StockAdjustmentDto {
  id: string
  number: string
  branchId: string
  branchName: string
  kind: string
  reason: string
  status: string
  notes: string | null
  createdAt: string
  createdBy: string | null
  voidedAt: string | null
  lines: { itemId: string; itemName: string; baseUnit: number; quantity: number; unitCost: number }[]
}

export interface InventoryInboxDto {
  belowMinCount: number
  negativeCount: number
  ordersToDispatch: number
  transfersToReceive: number
  differencesToResolve: number
  plannedProductions: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
}

// ─── Recetas ─────────────────────────────────────────────────────────────────

export interface RecipeLineDto {
  ingredientItemId: string
  ingredientName: string
  ingredientSku: string | null
  baseUnit: number
  quantity: number
  ingredientIsStockTracked: boolean
  ingredientHasRecipe: boolean
  unitCost: number | null
  lineCost: number | null
}

export interface RecipeDto {
  itemId: string
  itemName: string
  baseUnit: number
  /** Cuánto rinde una tanda, en la unidad del producto. */
  yieldQuantity: number
  notes: string | null
  lines: RecipeLineDto[]
  batchCost: number | null
  unitCost: number | null
  warnings: string[]
}

export interface SaveRecipeDto {
  yieldQuantity: number
  notes: string | null
  lines: { ingredientItemId: string; quantity: number }[]
}

/** Producto nuevo, copia exacta de otro, con otra receta. */
export interface CopyItemWithRecipeDto {
  name: string
  recipe: SaveRecipeDto
}
