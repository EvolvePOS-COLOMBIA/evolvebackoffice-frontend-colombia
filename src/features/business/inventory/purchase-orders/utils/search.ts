import type { GoodsReceiptDto, PurchaseOrderSummaryDto } from "../../types/purchasing"

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
 * Filtrado client-side de las órdenes de compra ya cargadas: el backend no
 * expone un parámetro de búsqueda todavía, así que la barra filtra sobre los
 * ítems de la página actual. Coincide por número de OC o proveedor.
 */
export function filterPurchaseOrders(items: PurchaseOrderSummaryDto[], search: string): PurchaseOrderSummaryDto[] {
  const term = normalize(search.trim())
  if (!term) return items
  return items.filter((item) => matches(term, item.number, item.supplierName))
}

/**
 * Filtrado client-side de las entradas de mercancía ya cargadas (mismo
 * criterio que filterPurchaseOrders). Coincide por número de entrada,
 * proveedor, factura y número de OC asociado.
 */
export function filterGoodsReceipts(items: GoodsReceiptDto[], search: string): GoodsReceiptDto[] {
  const term = normalize(search.trim())
  if (!term) return items
  return items.filter((item) =>
    matches(term, item.number, item.supplierName, item.invoiceNumber, item.purchaseOrderNumber)
  )
}
