// ─── Global Catalog Types ────────────────────────────────────────────────────
// Based on Swagger: /api/Items

export interface ItemResponseDto {
  id: string
  name: string | null
  sku: string | null
  description: string | null
  plu: number
  departmentId: number
  departmentName: string | null
  itemType: number
  itemTypeName: string | null
  unitOfMeasure: string | null
  taxable: boolean
  webItem: boolean
  isActive: boolean
  trackInventory: boolean
  brandId: number
  itemPresentationId: number
  askQuantity: number
  available: number
  dateCreated: string
  createdAt: string
}

export interface CreateItemDto {
  name: string | null
  sku: string | null
  description: string | null
  plu: number
  departmentId: number
  itemType: number
  unitOfMeasure: string | null
  taxable: boolean
  webItem: boolean
  extendedDescription: string | null
  subDescription1: string | null
  subDescription2: string | null
  subDescription3: string | null
  priceMustBeEntered: boolean
  brandId: number
  itemPresentationId: number
  askQuantity: number
}

export interface UpdateItemDto {
  name: string | null
  sku: string | null
  description: string | null
  plu: number | null
  departmentId: number | null
  itemType: number | null
  unitOfMeasure: string | null
  taxable: boolean | null
  webItem: boolean | null
  extendedDescription: string | null
  subDescription1: string | null
  subDescription2: string | null
  subDescription3: string | null
  priceMustBeEntered: boolean | null
  brandId: number | null
  itemPresentationId: number | null
  askQuantity: number | null
}

// ─── Branch Items Types ──────────────────────────────────────────────────────
// Based on Swagger: /api/branches/{branchId}/items

export interface BranchItemResponseDto {
  id: string
  branchPublicId: string
  branchName: string | null
  itemPublicId: string
  itemName: string | null
  itemSku: string | null
  binLocation: string | null
  quantityCommitted: number
  price: number
  priceA: number
  priceB: number
  priceC: number
  salePrice: number
  saleStartDate: string | null
  saleEndDate: string | null
  cost: number
  quantity: number
  reorderPoint: number
  restockLevel: number
  lastCost: number
  replacementCost: number
  inactive: boolean
  lastReceived: string | null
  lastSold: string | null
  lastCounted: string | null
  available: number
  createdAt: string
}

export interface CreateBranchItemDto {
  branchPublicId: string
  itemPublicId: string
  price: number
  priceA: number
  priceB: number
  priceC: number
  salePrice: number
  cost: number
  quantity: number
  reorderPoint: number
  restockLevel: number
  binLocation: string | null
}

export interface UpdateBranchItemDto {
  price: number | null
  priceA: number | null
  priceB: number | null
  priceC: number | null
  salePrice: number | null
  saleStartDate: string | null
  saleEndDate: string | null
  cost: number | null
  replacementCost: number | null
}

export interface AdjustBranchItemStockDto {
  quantity: number
  quantityCommitted: number | null
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ItemListParams {
  pageNumber?: number
  pageSize?: number
}

// ─── Item Sync (for POS offline) ─────────────────────────────────────────────

export interface ItemSyncDto {
  id: string
  name: string | null
  sku: string | null
  description: string | null
  plu: number
  departmentId: number
  itemType: number
  unitOfMeasure: string | null
  taxable: boolean
  isActive: boolean
  price: number
  priceA: number
  priceB: number
  priceC: number
  salePrice: number
  cost: number
  quantity: number
  available: number
  binLocation: string | null
  inactive: boolean
  updatedAtUtc: string
}
