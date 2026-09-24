// ─── Tax Rates (Tasas de impuesto) ──────────────────────────────────────────
// Contratos del backend: /api/taxrates y /api/items/{itemId}/tax-rates
// Patrón Doble Identificador: las rutas {id} reciben Guid y la respuesta expone
// `id` como Guid (PublicId).

/** Tasa de impuesto del catálogo del tenant (respuesta del backend). */
export interface TaxRate {
  id: string
  countryCode: string
  regionCode?: string | null
  name: string
  /** Código numérico del enum TaxType (0=IVA, 1=ICA, 2=Renta, 3=INC, 4=Exento, 99=Custom). */
  taxType: number
  /** Nombre del enum devuelto por el backend (ej: "IVA", "Custom"). */
  taxTypeName: string
  /** Tasa en formato decimal 0..1 (ej: 0.19 = 19%). */
  rate: number
  isDefault: boolean
  isActive: boolean
  validFrom?: string | null
  validTo?: string | null
  description?: string | null
  createdAt: string
}

/** DTO para crear una tasa de impuesto. */
export interface CreateTaxRateDto {
  countryCode: string
  name: string
  taxType: number
  /** Tasa en formato decimal 0..1. */
  rate: number
  isDefault?: boolean
  regionCode?: string | null
  description?: string | null
  validFrom?: string | null
  validTo?: string | null
}

/**
 * DTO para actualizar una tasa de impuesto.
 * El backend no permite cambiar countryCode ni taxType al editar.
 */
export interface UpdateTaxRateDto {
  name?: string | null
  /** Tasa en formato decimal 0..1. */
  rate?: number | null
  isDefault?: boolean | null
  regionCode?: string | null
  description?: string | null
  validFrom?: string | null
  validTo?: string | null
}

/** Impuesto asignado a un item (respuesta de /api/items/{itemId}/tax-rates). */
export interface ItemTaxRate {
  taxRateId: string
  name: string
  taxType: number
  taxTypeName: string
  /** Tasa en formato decimal 0..1. */
  rate: number
}

/** Cuerpo del POST /api/items/{itemId}/tax-rates (el backend solo agrega, nunca quita). */
export interface AssignItemTaxRatesDto {
  taxRateIds: string[]
}

/** Respuesta paginada normalizada del listado de tasas. */
export interface PagedTaxRates {
  data: TaxRate[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── Helpers de conversión tasa (0..1) ↔ porcentaje (0..100) ────────────────

/** Convierte la tasa del backend (0..1) a porcentaje para la UI (0..100). */
export function rateToPercent(rate: number): number {
  return Math.round(rate * 10000) / 100
}

/** Convierte el porcentaje de la UI (0..100) a la tasa del backend (0..1). */
export function percentToRate(percent: number): number {
  return Math.round(percent * 100) / 10000
}

/** Clave i18n del tipo de impuesto según el código numérico del backend. */
export function taxTypeTextKey(taxType: number): string {
  switch (taxType) {
    case 0:
      return "tax_type_iva"
    case 1:
      return "tax_type_ica"
    case 2:
      return "tax_type_renta"
    case 3:
      return "tax_type_inc"
    case 4:
      return "tax_type_exempt"
    default:
      return "tax_type_other"
  }
}
