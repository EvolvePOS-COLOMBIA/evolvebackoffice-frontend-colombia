import type { ProductionOrderSummaryDto } from "../../types/production"

/**
 * Normaliza un texto para compararlo sin distinguir mayúsculas ni acentos:
 * "Producción" y "producción" o "almacén" y "almacen" coinciden.
 * Misma normalización Unicode que isBeverage en orders.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function matches(term: string, ...fields: (string | null | undefined)[]): boolean {
  return fields.some((field) => normalize(field ?? "").includes(term))
}

/**
 * Filtrado client-side de las órdenes de producción ya cargadas: el backend no
 * expone un parámetro de búsqueda todavía, así que la barra filtra sobre los
 * ítems de la página actual. Coincide por número de orden o por producto.
 */
export function filterProductionOrders(
  items: ProductionOrderSummaryDto[],
  search: string
): ProductionOrderSummaryDto[] {
  const term = normalize(search.trim())
  if (!term) return items
  return items.filter((item) => matches(term, item.number, ...item.products.map((product) => product.itemName)))
}
