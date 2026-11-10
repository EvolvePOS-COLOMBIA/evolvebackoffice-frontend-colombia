// ─── Modificadores de productos (Item Modifiers) ────────────────────────────
// Contrato backend: /api/itemmodifiers/groups y /api/itemmodifiers/items
// El tipo de modificador (ModifierType) se envía/recibe como string ("Optional", ...).

import type { ItemResponseDto } from "../../catalog/types"

/** Reutiliza el tipo de artículo del catálogo (usado por los selectores de producto). */
export type { ItemResponseDto }

/** Valores del enum `ModifierType` del backend (se serializan como nombre de enum). */
export const MODIFIER_TYPE_CODES = ["Optional", "Required", "GroupSingle", "GroupMultiple"] as const

export type ModifierTypeCode = (typeof MODIFIER_TYPE_CODES)[number]

/** Clave i18n del label de cada tipo de modificador (acepta nombre o valor numérico). */
export const MODIFIER_TYPE_LABEL_KEYS: Record<string, string> = {
  Optional: "modifier_optional",
  "0": "modifier_optional",
  Required: "modifier_required",
  "1": "modifier_required",
  GroupSingle: "modifier_group_single",
  "10": "modifier_group_single",
  GroupMultiple: "modifier_group_multiple",
  "15": "modifier_group_multiple",
}

/**
 * Normaliza `modifierTypeCode` a un código válido.
 * El backend envía el nombre del enum, pero se tolera el valor numérico por seguridad.
 */
export function normalizeModifierTypeCode(value: string | number | null | undefined): ModifierTypeCode {
  const raw = String(value ?? "")
  const byName = MODIFIER_TYPE_CODES.find((code) => code.toLowerCase() === raw.toLowerCase())
  if (byName) return byName

  switch (raw) {
    case "0":
      return "Optional"
    case "1":
      return "Required"
    case "10":
      return "GroupSingle"
    case "15":
      return "GroupMultiple"
    default:
      return "Optional"
  }
}

/** Clave i18n del label para un tipo de modificador crudo (nombre o número). */
export function modifierTypeLabelKey(value: string | number | null | undefined): string {
  return MODIFIER_TYPE_LABEL_KEYS[String(value ?? "")] ?? "modifier_optional"
}

/** Grupo de modificadores (ej: "Tamaños", "Extras"). */
export interface ModifierGroup {
  id: string
  name: string
  description: string | null
  minSelection: number
  maxSelection: number
  sortOrder: number
  isActive: boolean
}

/** Modificador de un producto: relación padre → hijo con grupo y tipo. */
export interface ItemModifier {
  id: string
  parentItemId: string
  childItemId: string
  childItemName: string | null
  childItemSku: string | null
  modifierGroupId: string | null
  modifierGroupName: string | null
  /** Nombre del enum ("Optional"...) o, como respaldo, su valor numérico. */
  modifierTypeCode: string | number
  modifierTypeName: string | null
  minQuantity: number
  maxQuantity: number
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

export interface CreateModifierGroupDto {
  name: string
  description: string | null
  minSelection: number
  maxSelection: number
  sortOrder: number
  isActive: boolean
}

/** El PUT del backend acepta el mismo cuerpo completo que el POST. */
export interface UpdateModifierGroupDto {
  name: string
  description: string | null
  minSelection: number
  maxSelection: number
  sortOrder: number
  isActive: boolean
}

export interface CreateItemModifierDto {
  parentItemId: string
  childItemId: string
  modifierGroupId: string | null
  modifierTypeCode: ModifierTypeCode
  minQuantity: number
  maxQuantity: number
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

/** Campos opcionales del PUT: null/undefined = no cambiar. */
export interface UpdateItemModifierDto {
  modifierGroupId?: string | null
  modifierTypeCode?: ModifierTypeCode
  minQuantity?: number
  maxQuantity?: number
  extraPrice?: number
  sortOrder?: number
  isActive?: boolean
}
