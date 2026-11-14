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
  pageSize?: number
}): Promise<PagedResult<ProductionOrderSummaryDto>> {
  const { data } = await api.get<{ data: ProductionOrderSummaryDto[]; totalCount: number }>("/api/production-orders", {
    params: { ...params, pageSize: params.pageSize ?? INVENTORY_PAGE_SIZE },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export type ProductionStats = { totalCount: number; totalCost: number }

/** Agrega el histórico de la sucursal: el endpoint pagina y no expone totales. */
export async function getProductionStats(branchId: string): Promise<ProductionStats> {
  const pageSize = 100
  const maxPages = 500
  let pageNumber = 1
  let fetched = 0
  let totalCount = 0
  let totalCost = 0

  while (pageNumber <= maxPages) {
    const page = await getProductionOrders({ branchId, status: "done", pageNumber, pageSize })
    totalCount = page.totalCount
    for (const order of page.items) {
      if (order.status !== "Completed") continue
      totalCost += order.totalCost
    }
    fetched += page.items.length
    pageNumber += 1
    // El totalCount manda: el backend puede limitar el pageSize pedido, por eso no se
    // decide el final por el largo de la página.
    if (fetched >= totalCount || page.items.length === 0) break
  }

  return { totalCount, totalCost }
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
