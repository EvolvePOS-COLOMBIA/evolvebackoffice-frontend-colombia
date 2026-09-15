import { api } from "@/config/axios-client"
import type {
  AdjustBranchItemStockDto,
  BranchItemResponseDto,
  CreateBranchItemDto,
  ItemListParams,
  PaginatedResponse,
  UpdateBranchItemDto,
} from "../types"

/**
 * Branch items endpoints: /api/branches/{branchId}/items
 * These manage pricing, stock, and assignment of items to a specific branch.
 */

export async function getBranchItems(
  branchId: string,
  params: ItemListParams = {}
): Promise<PaginatedResponse<BranchItemResponseDto>> {
  const pageNumber = params.pageNumber ?? 1
  const pageSize = params.pageSize ?? 20
  const { data } = await api.get<{ data: BranchItemResponseDto[]; totalCount: number }>(
    `/api/branches/${branchId}/items`,
    {
      params: { pageNumber, pageSize },
    }
  )
  return {
    data: data.data,
    pageNumber,
    pageSize,
    totalCount: data.totalCount,
    totalPages: Math.ceil(data.totalCount / pageSize),
  }
}

export async function getBranchItemById(branchId: string, id: string): Promise<BranchItemResponseDto> {
  const { data } = await api.get<BranchItemResponseDto>(`/api/branches/${branchId}/items/${id}`)
  return data
}

export async function getBranchItemByItemPublicId(
  branchId: string,
  itemPublicId: string
): Promise<BranchItemResponseDto> {
  const { data } = await api.get<BranchItemResponseDto>(`/api/branches/${branchId}/items/by-item/${itemPublicId}`)
  return data
}

export async function createBranchItem(branchId: string, payload: CreateBranchItemDto): Promise<BranchItemResponseDto> {
  const { data } = await api.post<BranchItemResponseDto>(`/api/branches/${branchId}/items`, payload)
  return data
}

export async function updateBranchItemPricing(
  branchId: string,
  id: string,
  payload: UpdateBranchItemDto
): Promise<BranchItemResponseDto> {
  const { data } = await api.put<BranchItemResponseDto>(`/api/branches/${branchId}/items/${id}/pricing`, payload)
  return data
}

export async function adjustBranchItemStock(
  branchId: string,
  id: string,
  payload: AdjustBranchItemStockDto
): Promise<BranchItemResponseDto> {
  const { data } = await api.post<BranchItemResponseDto>(`/api/branches/${branchId}/items/${id}/stock`, payload)
  return data
}

export async function deleteBranchItem(branchId: string, id: string): Promise<void> {
  await api.delete(`/api/branches/${branchId}/items/${id}`)
}
