import type { ProductLine } from "../components/product-lines-editor"
import type { LineInput } from "../types/purchasing"
import { BASE_UNIT_KEY } from "./units"

// Number.isFinite descarta valores como "1e309" (Infinity), que JSON envía como null.
export const isPositive = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0
export const isNonNegative = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0

/** Líneas completas: cantidad > 0 (y precio ≥ 0 si se pide). */
export function linesAreValid(lines: ProductLine[], withPrice = false): boolean {
  return (
    lines.length > 0 &&
    lines.every(
      (l) => isPositive(l.quantity.amount) && (!withPrice || (l.unitCost !== undefined && isNonNegative(l.unitCost)))
    )
  )
}

/** Al formato del backend: cantidad en la presentación elegida (o unidad base) + id de presentación. */
export function toLineInputs(lines: ProductLine[]): LineInput[] {
  return lines.map((l) => ({
    itemId: l.itemId,
    quantity: Number(l.quantity.amount),
    packagingId: l.quantity.unitKey === BASE_UNIT_KEY ? null : l.quantity.unitKey,
  }))
}
