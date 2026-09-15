import type { BusinessTypeKey, ModuleKey, ModuleSelection, OnboardingDraft } from "./types"

/**
 * Catálogo local de tipos de negocio.
 *
 * Provisional: el backend todavía no expone `GET /api/business-types` ni
 * modela `businessTypeId` en la sucursal (ver `features.businessTypesApi`).
 * Las claves son estables para que la migración sea un mapeo directo.
 */
export const BUSINESS_TYPES: BusinessTypeKey[] = [
  "restaurante",
  "rapidas",
  "tienda",
  "panaderia",
  "bar",
  "farmacia",
  "servicios",
  "otro",
]

export const TOGGLEABLE_MODULES: ModuleKey[] = ["inventario", "clientes", "proveedores", "reportes"]

/** Módulos base, no desactivables. Se cuentan en el total que ve el usuario. */
export const BASE_MODULE_COUNT = 3

export const TOTAL_MODULE_COUNT = BASE_MODULE_COUNT + TOGGLEABLE_MODULES.length

/**
 * Selección sugerida de módulos según el tipo de negocio de la sucursal.
 * Es solo una propuesta: el usuario puede cambiar cualquiera.
 */
export const MODULE_PRESETS: Record<BusinessTypeKey, ModuleSelection> = {
  restaurante: { inventario: true, clientes: false, proveedores: true, reportes: true },
  rapidas: { inventario: true, clientes: false, proveedores: true, reportes: true },
  tienda: { inventario: true, clientes: false, proveedores: true, reportes: true },
  panaderia: { inventario: true, clientes: false, proveedores: true, reportes: true },
  bar: { inventario: true, clientes: false, proveedores: true, reportes: true },
  farmacia: { inventario: true, clientes: true, proveedores: true, reportes: true },
  servicios: { inventario: false, clientes: true, proveedores: false, reportes: true },
  otro: { inventario: true, clientes: true, proveedores: true, reportes: true },
}

export const DEFAULT_BUSINESS_TYPE: BusinessTypeKey = "restaurante"

export const EMPTY_DRAFT: OnboardingDraft = {
  stepIndex: 0,
  account: null,
  business: null,
  branch: null,
  modules: MODULE_PRESETS[DEFAULT_BUSINESS_TYPE],
  createdBranchId: null,
  accountSaved: false,
  passwordChanged: false,
}

export function countActiveModules(modules: ModuleSelection): number {
  return BASE_MODULE_COUNT + TOGGLEABLE_MODULES.filter((key) => modules[key]).length
}
