// ─── Precios, márgenes y ventas a clientes ───────────────────────────────────
// Precios y costos por unidad base.

export interface ProductMarginDto {
  branchItemId: string
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  /** stock = costo promedio · recipe = costo de la receta (plato). */
  kind: "stock" | "recipe"
  sellsHere: boolean
  /** null = lo que diga el producto. */
  sellHereOverride: boolean | null
  productIsSellable: boolean
  price: number
  taxRate: number
  netPrice: number
  cost: number | null
  margin: number | null
  marginPercent: number | null
  /** Solo proveedoras: precio al que se envía a las demás sucursales (precio sin impuestos o costo). */
  transferPrice: number | null
  /** true = no tiene precio de venta y se envía al costo. */
  transferAtCost: boolean
}

export interface ItemPriceDto {
  itemId: string
  price: number
  cost: number | null
}

export interface WholesaleSaleLineDto {
  itemId: string
  itemName: string
  sku: string | null
  baseUnit: number
  packagingName: string | null
  packagingFactor: number | null
  quantity: number
  unitPrice: number
  unitCost: number
  taxRate: number
  total: number
  profit: number
}

export interface WholesaleSaleDto {
  id: string
  number: string
  branchId: string
  branchName: string
  customerId: string | null
  customerName: string | null
  customerPhone: string | null
  status: "Applied" | "Voided"
  notes: string | null
  createdAt: string
  createdBy: string | null
  total: number
  totalCost: number
  profit: number
  profitPercent: number | null
  lines: WholesaleSaleLineDto[]
}

export interface CreateWholesaleSaleDto {
  branchId: string
  customerId: string | null
  customerName: string | null
  notes: string | null
  lines: { itemId: string; quantity: number; unitPrice: number; packagingId: string | null }[]
}
