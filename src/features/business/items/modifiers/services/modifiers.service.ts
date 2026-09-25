import { api } from "@/config/axios-client"
import { getItems } from "../../catalog/services/items.service"
import type { ItemResponseDto } from "../../catalog/types"
import type {
  CreateItemModifierDto,
  CreateModifierGroupDto,
  ItemModifier,
  ModifierGroup,
  UpdateItemModifierDto,
  UpdateModifierGroupDto,
} from "../types"

/** El backend puede responder array plano o envelope paginado: se normaliza siempre. */
type ListPayload<T> = T[] | { data?: T[]; items?: T[]; totalCount?: number }

function normalizeList<T>(payload: ListPayload<T> | null | undefined): T[] {
  if (Array.isArray(payload)) return payload
  return payload?.data ?? payload?.items ?? []
}

// ─── Grupos de modificadores ────────────────────────────────────────────────

/** Lista todos los grupos de modificadores (incluye inactivos). */
export async function getModifierGroups(): Promise<ModifierGroup[]> {
  const { data } = await api.get<ListPayload<ModifierGroup>>("/api/itemmodifiers/groups")
  return normalizeList(data)
}

/** Crea un grupo de modificadores ("Tamaños", "Extras", ...). */
export async function createModifierGroup(dto: CreateModifierGroupDto): Promise<ModifierGroup> {
  const { data } = await api.post<ModifierGroup>("/api/itemmodifiers/groups", dto)
  return data
}

/** Actualiza un grupo de modificadores (body completo). */
export async function updateModifierGroup(id: string, dto: UpdateModifierGroupDto): Promise<void> {
  await api.put(`/api/itemmodifiers/groups/${id}`, dto)
}

/** Elimina un grupo de modificadores. */
export async function deleteModifierGroup(id: string): Promise<void> {
  await api.delete(`/api/itemmodifiers/groups/${id}`)
}

// ─── Modificadores por producto ─────────────────────────────────────────────

/** Lista los modificadores de un producto padre. */
export async function getItemModifiers(parentItemId: string, branchId?: string): Promise<ItemModifier[]> {
  const { data } = await api.get<ListPayload<ItemModifier>>(`/api/itemmodifiers/items/${parentItemId}`, {
    params: branchId ? { branchId } : undefined,
  })
  return normalizeList(data)
}

/** Agrega un modificador (producto hijo) a un producto padre; con branchId lo crea en el ámbito de la sucursal. */
export async function createItemModifier(dto: CreateItemModifierDto, branchId?: string): Promise<ItemModifier> {
  const { data } = await api.post<ItemModifier>("/api/itemmodifiers/items", dto, {
    params: branchId ? { branchId } : undefined,
  })
  return data
}

/** Actualiza un modificador existente (body parcial). */
export async function updateItemModifier(id: string, dto: UpdateItemModifierDto): Promise<void> {
  await api.put(`/api/itemmodifiers/items/${id}`, dto)
}

/** Elimina un modificador de un producto. */
export async function deleteItemModifier(id: string): Promise<void> {
  await api.delete(`/api/itemmodifiers/items/${id}`)
}

// ─── Selectores ─────────────────────────────────────────────────────────────

/** Artículos del catálogo para los selectores de producto (hasta 200 registros). */
export async function getItemsForPicker(): Promise<ItemResponseDto[]> {
  const page = await getItems({ pageNumber: 1, pageSize: 200 })
  return page?.data ?? []
}
