/**
 * Alcance de los módulos de la plataforma.
 *
 * La fuente de verdad es el backend (`ModuleScope` en BackendPOS), que expone
 * `isBranchScoped` en `/api/tenant-modules` y `/api/modules`. Los módulos por
 * sucursal se asignan a cada sede y su cantidad limita cuántas sedes pueden
 * tenerlo; los globales (CREDITO, IA, FIDELIZACION) se habilitan una sola vez
 * para todo el negocio y no se asignan a sucursales.
 *
 * Esta lista solo es el respaldo cuando la respuesta no trae el flag (APIs
 * antiguas o tipos de plataforma que aún no lo mapean): debe coincidir con
 * `ModuleScope.BranchScopedCodes` del backend. Un código desconocido se trata
 * como global, igual que en el backend.
 */
const BRANCH_SCOPED_MODULE_CODES = new Set(["DOMICILIOS", "ORDERS", "PRODUCCION", "WOOCOMMERCE", "CLUVI", "MESAS"])

/** true si el módulo se asigna por sucursal. Usa el flag del backend si viene. */
export function isBranchScopedModule(code: string | null | undefined, isBranchScoped?: boolean | null): boolean {
  if (typeof isBranchScoped === "boolean") return isBranchScoped
  if (!code) return false
  return BRANCH_SCOPED_MODULE_CODES.has(code.toUpperCase())
}

/** true si el módulo es global del tenant (no se asigna a sucursales). */
export function isTenantOnlyModule(code: string | null | undefined, isBranchScoped?: boolean | null): boolean {
  if (!code && typeof isBranchScoped !== "boolean") return false
  return !isBranchScopedModule(code, isBranchScoped)
}
