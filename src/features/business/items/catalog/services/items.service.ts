import { api } from "@/config/axios-client"
import type {
  CreateItemDto,
  ItemListParams,
  ItemResponseDto,
  PaginatedResponse,
  UpdateItemDto,
} from "../types"

/**
 * Global catalog endpoints: /api/Items
 * These manage the product definitions (no prices/stock — those live in branch-items).
 */

export async function getItems(params: ItemListParams = {}): Promise<PaginatedResponse<ItemResponseDto>> {
  const { data } = await api.get<PaginatedResponse<ItemResponseDto>>("/api/Items", {
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  })
  return data
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
