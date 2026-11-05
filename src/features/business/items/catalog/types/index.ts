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
  priceMustBeEntered: boolean
  taxRates?: ItemTaxRateDto[]
  /** false = ingrediente: no se vende en POS ni plataformas. */
  isSellable: boolean
  /** Unidad base de inventario: 0 und, 1 g, 2 ml. */
  baseUnit: number
  /** Tiene receta (plato, semielaborado o producto terminado). */
  hasRecipe?: boolean
  /** Galería ordenada: la posición 0 es la principal. */
  images?: EntityImageDto[]
}

/** Imagen de la galería (máx. 5). Url pública bajo /media (la consumen Cluvi y WooCommerce). */
export interface EntityImageDto {
  id: string
  entityType: string
  position: number
  url: string
  contentType: string
  /** Privada = no se ofrece a otros negocios en la sugerencia por SKU. */
  isPrivate: boolean
  sizeBytes: number
  createdAt: string
}

export interface UploadEntityImageDto {
  /** Base64 sin prefijo data:. */
  data: string
  contentType: string
  isPrivate?: boolean
  fileName?: string
}

/** Producto con el mismo SKU en otro negocio; solo trae sus imágenes públicas. */
export interface ItemSuggestDto {
  found: boolean
  sku?: string | null
  name?: string | null
  description?: string | null
  subDescription1?: string | null
  subDescription2?: string | null
  subDescription3?: string | null
  unitOfMeasure?: string | null
  taxable?: boolean
  plu?: number
  departmentName?: string | null
  sourceTenant?: string | null
  images?: EntityImageDto[] | null
}

export interface ItemTaxRateDto {
  taxRateId: string
  name: string
  taxType: number
  taxTypeName: string
  rate: number
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
  trackInventory: boolean
  isSellable: boolean
  baseUnit: number
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
  trackInventory: boolean | null
  isSellable: boolean | null
  baseUnit: number | null
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
  useGlobalTaxes: boolean
  useGlobalModifiers: boolean
  /** Si se vende en esta sucursal (POS y menú de Cluvi). */
  sellsHere: boolean
  /** Lo que dice el producto en el catálogo (false = ingrediente). */
  productIsSellable: boolean
  /** Unidad base del producto (0 und, 1 g, 2 ml). */
  baseUnit: number
  /** Imagen principal del producto (solo en el listado de la sucursal). */
  imageUrl?: string | null
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
  searchField?: string
  searchValue?: string
  /** Incluye productos desactivados/soft-deleteados (para mostrar el badge y poder reactivarlos). */
  includeInactive?: boolean
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
