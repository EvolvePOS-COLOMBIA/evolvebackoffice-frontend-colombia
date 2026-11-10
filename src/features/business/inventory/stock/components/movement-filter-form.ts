import type { MovementFilters } from "../../types"

export const ALL = "all"

/** Lo que el usuario escribe; se convierte a {@link MovementFilters} con {@link toMovementFilters}. */
export type MovementFilterForm = {
  search: string
  type: string
  direction: string
  from: string
  to: string
  documentType: string
  documentNumber: string
  reason: string
  createdBy: string
  notes: string
  reversed: string
  minQuantity: string
  maxQuantity: string
  minUnitCost: string
  maxUnitCost: string
  minTotalCost: string
  maxTotalCost: string
}

export const EMPTY_MOVEMENT_FILTERS: MovementFilterForm = {
  search: "",
  type: ALL,
  direction: ALL,
  from: "",
  to: "",
  documentType: ALL,
  documentNumber: "",
  reason: ALL,
  createdBy: ALL,
  notes: "",
  reversed: ALL,
  minQuantity: "",
  maxQuantity: "",
  minUnitCost: "",
  maxUnitCost: "",
  minTotalCost: "",
  maxTotalCost: "",
}

// Filtros que van en "Más filtros" (los demás siempre se ven).
export const MORE_KEYS: (keyof MovementFilterForm)[] = [
  "documentType",
  "documentNumber",
  "reason",
  "createdBy",
  "notes",
  "reversed",
  "minQuantity",
  "maxQuantity",
  "minUnitCost",
  "maxUnitCost",
  "minTotalCost",
  "maxTotalCost",
]

// Distinto de su valor vacío: "all" solo es "sin filtro" en las listas, no en los textos.
export const isSet = (form: MovementFilterForm, key: keyof MovementFilterForm) =>
  form[key].trim() !== "" && form[key] !== EMPTY_MOVEMENT_FILTERS[key]

export const hasMovementFilters = (form: MovementFilterForm) =>
  (Object.keys(form) as (keyof MovementFilterForm)[]).some((k) => isSet(form, k))

// Filtros ocultos en el popover del toolbar (search y type se ven en la fila).
// direction también vive en el popover aunque no esté en MORE_KEYS (MORE_KEYS
// solo listaba la sección "Más filtros" del panel anterior).
export const countHiddenMovementFilters = (form: MovementFilterForm) =>
  (["from", "to", "direction", ...MORE_KEYS] as (keyof MovementFilterForm)[]).filter((k) => isSet(form, k)).length

const text = (value: string) => value.trim() || undefined
const option = (value: string) => (value === ALL ? undefined : value)
const amount = (value: string) => {
  const n = Number(value.replace(",", "."))
  return value.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined
}
// Días completos en la hora local: "hasta" incluye todo ese día.
const dayStart = (value: string, plusDays = 0) => {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d + plusDays).toISOString()
}

export function toMovementFilters(form: MovementFilterForm): MovementFilters {
  return {
    search: text(form.search),
    type: option(form.type),
    direction: option(form.direction) as MovementFilters["direction"],
    from: dayStart(form.from),
    to: dayStart(form.to, 1),
    documentType: option(form.documentType),
    documentNumber: text(form.documentNumber),
    reason: option(form.reason),
    createdBy: option(form.createdBy),
    notes: text(form.notes),
    reversed: form.reversed === ALL ? undefined : form.reversed === "yes",
    minQuantity: amount(form.minQuantity),
    maxQuantity: amount(form.maxQuantity),
    minUnitCost: amount(form.minUnitCost),
    maxUnitCost: amount(form.maxUnitCost),
    minTotalCost: amount(form.minTotalCost),
    maxTotalCost: amount(form.maxTotalCost),
  }
}
