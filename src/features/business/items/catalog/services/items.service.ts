import { api } from "@/config/axios-client"
import type {
  AdjustStockBody,
  CreateItemDto,
  ItemListParams,
  ItemResponseDto,
  PaginatedItemsResponse,
  UpdateItemDto,
} from "../types"

export async function getItems(params: ItemListParams = {}): Promise<PaginatedItemsResponse> {
  const { data } = await api.get<PaginatedItemsResponse>("/api/Items", {
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

export async function adjustStock(id: string, delta: AdjustStockBody): Promise<void> {
  await api.post(`/api/Items/${id}/stock`, delta)
}
