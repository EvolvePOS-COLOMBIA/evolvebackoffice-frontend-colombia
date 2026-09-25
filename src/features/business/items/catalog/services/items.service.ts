import { api } from "@/config/axios-client"
import type { CreateItemDto, ItemListParams, ItemResponseDto, PaginatedResponse, UpdateItemDto } from "../types"

/**
 * Global catalog endpoints: /api/Items
 * These manage the product definitions (no prices/stock — those live in branch-items).
 */

export async function getItems(params: ItemListParams = {}): Promise<PaginatedResponse<ItemResponseDto>> {
  const pageNumber = params.pageNumber ?? 1
  const pageSize = params.pageSize ?? 20
  const { data } = await api.get<{ data: ItemResponseDto[]; totalCount: number }>("/api/Items", {
    params: {
      pageNumber,
      pageSize,
      searchField: params.searchField,
      searchValue: params.searchValue,
      includeInactive: params.includeInactive,
    },
  })
  return {
    data: data.data,
    pageNumber,
    pageSize,
    totalCount: data.totalCount,
    totalPages: Math.ceil(data.totalCount / pageSize),
  }
}

export async function getItemById(id: string): Promise<ItemResponseDto> {
  const { data } = await api.get<ItemResponseDto>(`/api/Items/${id}`)
  return data
}

export async function createItem(payload: CreateItemDto): Promise<ItemResponseDto> {
  const { data } = await api.post<ItemResponseDto>("/api/Items", payload)
  return data
}

export async function updateItem(id: string, payload: UpdateItemDto): Promise<ItemResponseDto> {
  const { data } = await api.put<ItemResponseDto>(`/api/Items/${id}`, payload)
  return data
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/api/Items/${id}`)
}

/** Reactiva un producto (reverse del soft-delete). */
export async function activateItem(id: string): Promise<void> {
  await api.post(`/api/Items/${id}/activate`)
}
