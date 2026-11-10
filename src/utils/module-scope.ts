/**
 * Alcance de los módulos de la plataforma.
 *
 * Los módulos "solo tenant" se habilitan/deshabilitan una única vez para todo
 * el negocio (consola de plataforma) y NO se asignan a sucursales, por lo que
 * tampoco tienen cantidad de licencias (sucursales asignables).
 */
const TENANT_ONLY_MODULE_CODES = new Set(["CREDITO", "IA"])

export function isTenantOnlyModule(code: string | null | undefined): boolean {
  if (!code) return false
  return TENANT_ONLY_MODULE_CODES.has(code.toUpperCase())
}
