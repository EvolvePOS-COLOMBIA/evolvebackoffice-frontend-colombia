import { api } from "@/config/axios-client"
import type { PagedResult } from "../types"
import type { CreateWholesaleSaleDto, ItemPriceDto, ProductMarginDto, WholesaleSaleDto } from "../types/sales"
import { INVENTORY_PAGE_SIZE } from "./inventory.service"

type Paged<T> = { data: T[]; totalCount: number }

export async function getMargins(params: {
  branchId: string
  search?: string
  pageNumber: number
}): Promise<PagedResult<ProductMarginDto>> {
  const { data } = await api.get<Paged<ProductMarginDto>>("/api/inventory/margins", {
    params: { ...params, search: params.search?.trim() || undefined, pageSize: INVENTORY_PAGE_SIZE },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export async function getItemPrice(branchId: string, itemId: string): Promise<ItemPriceDto> {
  const { data } = await api.get<ItemPriceDto>("/api/inventory/price", { params: { branchId, itemId } })
  return data
}

export async function getSales(
  branchId: string,
  pageNumber: number,
  pageSize: number = INVENTORY_PAGE_SIZE
): Promise<PagedResult<WholesaleSaleDto>> {
  const { data } = await api.get<Paged<WholesaleSaleDto>>("/api/sales", {
    params: { branchId, pageNumber, pageSize },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export async function getSale(id: string): Promise<WholesaleSaleDto> {
  const { data } = await api.get<WholesaleSaleDto>(`/api/sales/${id}`)
  return data
}

export async function createSale(payload: CreateWholesaleSaleDto): Promise<WholesaleSaleDto> {
  const { data } = await api.post<WholesaleSaleDto>("/api/sales", payload)
  return data
}

export async function voidSale(id: string): Promise<WholesaleSaleDto> {
  const { data } = await api.post<WholesaleSaleDto>(`/api/sales/${id}/void`)
  return data
}

export type SalesStats = {
  /** Total de ventas de la sucursal (incluye anuladas), tal como lo reporta el backend. */
  totalCount: number
  totalSold: number
  profit: number
}

/**
 * Agrega el histórico completo de la sucursal. `/api/sales` solo pagina y no expone
 * totales (sin filtros de status ni fechas), así que se recorren las páginas y se suman
 * las ventas aplicadas; las anuladas no suman dinero pero sí cuentan en `totalCount`.
 */
export async function getSalesStats(branchId: string): Promise<SalesStats> {
  const pageSize = 100
  const maxPages = 500
  let pageNumber = 1
  let fetched = 0
  let totalCount = 0
  let totalSold = 0
  let profit = 0

  while (pageNumber <= maxPages) {
    const page = await getSales(branchId, pageNumber, pageSize)
    totalCount = page.totalCount
    for (const sale of page.items) {
      if (sale.status !== "Applied") continue
      totalSold += sale.total
      profit += sale.profit
    }
    fetched += page.items.length
    pageNumber += 1
    // El totalCount manda: el backend puede limitar el pageSize pedido, por eso no se
    // decide el final por el largo de la página.
    if (fetched >= totalCount || page.items.length === 0) break
  }

  return { totalCount, totalSold, profit }
}
