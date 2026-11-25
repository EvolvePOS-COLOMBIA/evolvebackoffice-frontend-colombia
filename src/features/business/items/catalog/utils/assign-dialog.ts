import type { ItemResponseDto } from "../types"

export type AssignMode = "select-branch" | "select-items"

export type AssignPayload = { items: ItemResponseDto[]; branchIds: string[] }

/** Disponibles primero, ya asignados al final (orden estable en cada grupo). */
export function splitAndSortItems(items: ItemResponseDto[], assignedIds: Set<string>): ItemResponseDto[] {
  const available = items.filter((item) => !assignedIds.has(item.id))
  const assigned = items.filter((item) => assignedIds.has(item.id))
  return [...available, ...assigned]
}

/** Filtra por nombre o SKU, sin distinguir mayúsculas. */
export function filterItems(items: ItemResponseDto[], query: string): ItemResponseDto[] {
  const q = query.toLowerCase()
  return items.filter((item) => item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q))
}

/** Ids que se pueden seleccionar (los ya asignados quedan fuera). */
export function getSelectableIds(items: ItemResponseDto[], assignedIds: Set<string>): string[] {
  return items.filter((item) => !assignedIds.has(item.id)).map((item) => item.id)
}

/** Selecciona todos los ids dados si falta alguno; si ya están todos, los quita (sin tocar el resto). */
export function toggleSelectAll(selected: Set<string>, selectableIds: string[]): Set<string> {
  const next = new Set(selected)
  if (selectableIds.length === 0) return next
  const allSelected = selectableIds.every((id) => selected.has(id))
  for (const id of selectableIds) {
    if (allSelected) next.delete(id)
    else next.add(id)
  }
  return next
}

type BuildAssignPayloadInput = {
  selectedItemIds: Set<string>
  items: ItemResponseDto[]
  targetBranchId: string | null
  selectedBranchIds: Set<string>
  assignedItemIds: Set<string>
}

/** Construye lo que se confirma; null si no hay nada válido que asignar. */
export function buildAssignPayload(mode: AssignMode, input: BuildAssignPayloadInput): AssignPayload | null {
  const { selectedItemIds, items, targetBranchId, selectedBranchIds, assignedItemIds } = input
  if (mode === "select-branch") {
    if (selectedBranchIds.size === 0) return null
    return { items, branchIds: Array.from(selectedBranchIds) }
  }
  if (!targetBranchId) return null
  const selected = items.filter((item) => selectedItemIds.has(item.id) && !assignedItemIds.has(item.id))
  if (selected.length === 0) return null
  return { items: selected, branchIds: [targetBranchId] }
}
