export interface ItemResponseDto {
  id: string
  name: string
  sku: string | null
  description: string | null
  salePrice: number
  costPrice: number
  stock: number
  minStockLevel: number
  category: string | null
  isActive: boolean
  trackInventory: boolean
  createdAt: string
}

export interface CreateItemDto {
  name: string
  sku?: string | null
  description?: string | null
  salePrice: number
  costPrice: number
  stock: number
  minStockLevel: number
  category?: string | null
}

export interface UpdateItemDto {
  name: string
  sku?: string | null
  description?: string | null
  salePrice?: number | null
  costPrice?: number | null
  category?: string | null
}

export type AdjustStockBody = number

export interface PaginatedItemsResponse {
  data: ItemResponseDto[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ItemListParams {
  pageNumber?: number
  pageSize?: number
}
