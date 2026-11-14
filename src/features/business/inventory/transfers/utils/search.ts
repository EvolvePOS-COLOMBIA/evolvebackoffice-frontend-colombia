import type { PurchaseOrderSummaryDto, TransferSummaryDto } from "../../types/purchasing"

/**
 * Normaliza un texto para compararlo sin distinguir mayúsculas ni acentos:
 * "Proveedor" y "proveedor" o "almacén" y "almacen" coinciden.
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
 * Filtrado client-side de los pedidos internos ya cargados: el backend no
 * expone un parámetro de búsqueda todavía, así que la barra filtra sobre los
 * ítems de la página actual. Coincide por número o por la contraparte visible
 * (sucursal en cualquiera de las dos direcciones).
 */
export function filterTransferOrders(items: PurchaseOrderSummaryDto[], search: string): PurchaseOrderSummaryDto[] {
  const term = normalize(search.trim())
  if (!term) return items
  return items.filter((item) => matches(term, item.number, item.supplierName, item.branchName))
}

/**
 * Filtrado client-side de los envíos ya cargados (mismo criterio que
 * filterTransferOrders). Coincide por número de envío, ruta "De → Para" y
 * número de OC asociado.
 */
export function filterTransfers(items: TransferSummaryDto[], search: string): TransferSummaryDto[] {
  const term = normalize(search.trim())
  if (!term) return items
  return items.filter((item) =>
    matches(term, item.number, item.fromBranchName, item.toBranchName, item.purchaseOrderNumber)
  )
}
