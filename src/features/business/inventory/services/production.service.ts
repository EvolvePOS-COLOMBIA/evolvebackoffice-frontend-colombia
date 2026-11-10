import { api } from "@/config/axios-client"
import type { PagedResult } from "../types"
import type {
  CompleteProductionOrderDto,
  CreateProductionOrderDto,
  ProducibleItemDto,
  ProductionOrderDto,
  ProductionOrderSummaryDto,
  ProductionPreviewDto,
} from "../types/production"
import { INVENTORY_PAGE_SIZE } from "./inventory.service"

export async function getProducibleItems(branchId: string): Promise<ProducibleItemDto[]> {
  const { data } = await api.get<ProducibleItemDto[]>("/api/production-orders/products", { params: { branchId } })
  return data ?? []
}

export async function getProductionPreview(
  branchId: string,
  itemId: string,
  quantity: number
): Promise<ProductionPreviewDto> {
  const { data } = await api.get<ProductionPreviewDto>("/api/production-orders/preview", {
    params: { branchId, itemId, quantity },
  })
  return data
}

export async function getProductionOrders(params: {
  branchId: string
  status?: string
  pageNumber: number
}): Promise<PagedResult<ProductionOrderSummaryDto>> {
  const { data } = await api.get<{ data: ProductionOrderSummaryDto[]; totalCount: number }>("/api/production-orders", {
    params: { ...params, pageSize: INVENTORY_PAGE_SIZE },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export async function getProductionOrder(id: string): Promise<ProductionOrderDto> {
  const { data } = await api.get<ProductionOrderDto>(`/api/production-orders/${id}`)
  return data
}

export async function createProductionOrder(payload: CreateProductionOrderDto): Promise<ProductionOrderDto> {
  const { data } = await api.post<ProductionOrderDto>("/api/production-orders", payload)
  return data
}

export async function completeProductionOrder(
  id: string,
  payload: CompleteProductionOrderDto
): Promise<ProductionOrderDto> {
  const { data } = await api.post<ProductionOrderDto>(`/api/production-orders/${id}/complete`, payload)
  return data
}

export async function cancelProductionOrder(id: string): Promise<ProductionOrderDto> {
  const { data } = await api.post<ProductionOrderDto>(`/api/production-orders/${id}/cancel`)
  return data
}

export async function voidProductionOrder(id: string): Promise<ProductionOrderDto> {
  const { data } = await api.post<ProductionOrderDto>(`/api/production-orders/${id}/void`)
  return data
}
