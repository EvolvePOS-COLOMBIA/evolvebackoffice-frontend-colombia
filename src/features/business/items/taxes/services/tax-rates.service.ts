import { api } from "@/config/axios-client"
import type {
  AssignItemTaxRatesDto,
  CreateTaxRateDto,
  ItemTaxRate,
  PagedTaxRates,
  TaxRate,
  UpdateTaxRateDto,
} from "../types"

type PagedPayload = { data?: TaxRate[]; items?: TaxRate[]; totalCount?: number } | TaxRate[]

/**
 * Normaliza la respuesta del listado: el backend devuelve `{data,totalCount}`,
 * pero según el endpoint puede venir `{items,...}` o incluso un array plano.
 */
function normalizePaged(payload: PagedPayload | null | undefined, pageNumber: number, pageSize: number): PagedTaxRates {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      pageNumber,
      pageSize,
      totalCount: payload.length,
      totalPages: Math.ceil(payload.length / pageSize),
    }
  }
  const items = payload?.data ?? payload?.items ?? []
  const totalCount = payload?.totalCount ?? items.length
  return {
    data: items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

/** Lista paginada de tasas de impuesto del tenant (incluye inactivas). */
export async function getTaxRates(pageNumber = 1, pageSize = 200): Promise<PagedTaxRates> {
  const { data } = await api.get<PagedPayload>("/api/taxrates", {
    params: { pageNumber, pageSize },
  })
  return normalizePaged(data, pageNumber, pageSize)
}

/** Tasas de impuesto marcadas como "por defecto" (activas), para dropdowns. */
export async function getTaxRateDefaults(): Promise<TaxRate[]> {
  const { data } = await api.get<unknown>("/api/taxrates/defaults")
  if (Array.isArray(data)) return data as TaxRate[]
  const payload = data as { data?: TaxRate[]; items?: TaxRate[] } | null
  return payload?.data ?? payload?.items ?? []
}

export async function createTaxRate(dto: CreateTaxRateDto): Promise<TaxRate> {
  const { data } = await api.post<TaxRate>("/api/taxrates", dto)
  return data
}

export async function updateTaxRate(id: string, dto: UpdateTaxRateDto): Promise<TaxRate> {
  const { data } = await api.put<TaxRate>(`/api/taxrates/${id}`, dto)
  return data
}

/** Activa o desactiva una tasa de impuesto (POST /activate | /deactivate). */
export async function setTaxRateActive(id: string, active: boolean): Promise<void> {
  await api.post(`/api/taxrates/${id}/${active ? "activate" : "deactivate"}`)
}

/** Impuestos actualmente asignados a un item. */
export async function getItemTaxRates(itemId: string, branchId?: string): Promise<ItemTaxRate[]> {
  const { data } = await api.get<unknown>(`/api/items/${itemId}/tax-rates`, {
    params: branchId ? { branchId } : undefined,
  })
  if (Array.isArray(data)) return data as ItemTaxRate[]
  const payload = data as { data?: ItemTaxRate[]; items?: ItemTaxRate[] } | null
  return payload?.data ?? payload?.items ?? []
}

/**
 * Asigna impuestos a un item.
 * IMPORTANTE: el backend solo AGREGA las tasas enviadas; las bajas se hacen
 * con `removeItemTaxRate` (nunca se envían eliminaciones en el POST).
 */
export async function assignItemTaxRates(itemId: string, taxRateIds: string[], branchId?: string): Promise<void> {
  const payload: AssignItemTaxRatesDto = { taxRateIds }
  await api.post(`/api/items/${itemId}/tax-rates`, payload, { params: branchId ? { branchId } : undefined })
}

/** Quita un impuesto específico de un item (global o de una sucursal con ?branchId). */
export async function removeItemTaxRate(itemId: string, taxRateId: string, branchId?: string): Promise<void> {
  await api.delete(`/api/items/${itemId}/tax-rates/${taxRateId}`, {
    params: branchId ? { branchId } : undefined,
  })
}
