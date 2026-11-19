import { isBranchScopedModule } from "@/utils/module-scope"

import type { BranchModuleResponseDto, TenantModuleResponseDto } from "../types/modules"

/**
 * Módulos del tenant que se pueden asignar a una sucursal: habilitados y de
 * alcance por sucursal. Los globales (CREDITO, IA, FIDELIZACION) ya aplican a
 * todo el negocio y el backend rechaza asignarlos.
 */
export function getAssignableTenantModules(tenantModules: TenantModuleResponseDto[]): TenantModuleResponseDto[] {
  return tenantModules.filter((tm) => tm.isEnabled && isBranchScopedModule(tm.moduleCode, tm.isBranchScoped))
}

/** Asignaciones de la sucursal que corresponden a módulos por sucursal. */
export function getBranchScopedAssignments(branchModules: BranchModuleResponseDto[]): BranchModuleResponseDto[] {
  return branchModules.filter((bm) => isBranchScopedModule(bm.moduleCode))
}

/**
 * PublicIds de los TenantModule ya asignados a la sucursal. Cruza por
 * `tenantModulePublicId`; con APIs anteriores (sin ese campo) cae al código.
 */
export function isTenantModuleAssigned(tm: TenantModuleResponseDto, branchModules: BranchModuleResponseDto[]): boolean {
  return branchModules.some((bm) =>
    bm.tenantModulePublicId ? bm.tenantModulePublicId === tm.id : bm.moduleCode === tm.moduleCode
  )
}
