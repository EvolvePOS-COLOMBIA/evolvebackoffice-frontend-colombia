import { isBranchScopedModule } from "@/utils/module-scope"

import type {
  BranchModuleResponseDto,
  LicenseState,
  ModuleUsage,
  ModuleUsageBranch,
  ModuleUsageMap,
  TenantModuleResponseDto,
} from "../types/modules"

/** Clave del uso de un módulo: public id del tenant module; si falta, el código. */
export function moduleUsageKey(module: { id?: string | null; moduleCode?: string | null }): string {
  return module.id || module.moduleCode || ""
}

function consumesLicense(module: TenantModuleResponseDto): boolean {
  return isBranchScopedModule(module.moduleCode, module.isBranchScoped)
}

/**
 * Cruza las asignaciones de todas las sucursales con los módulos del tenant.
 * Solo cuentan los módulos por sucursal y las asignaciones habilitadas; una
 * sucursal consume como máximo una licencia por módulo.
 */
export function computeModuleUsage(
  tenantModules: TenantModuleResponseDto[],
  branchModulesByBranch: Record<string, BranchModuleResponseDto[]>
): ModuleUsageMap {
  const result: ModuleUsageMap = {}
  for (const module of tenantModules.filter(consumesLicense)) {
    const branches = new Map<string, ModuleUsageBranch>()
    for (const [branchId, assignments] of Object.entries(branchModulesByBranch)) {
      const hasIt = assignments.some(
        (bm) =>
          bm.isEnabled &&
          (bm.tenantModulePublicId ? bm.tenantModulePublicId === module.id : bm.moduleCode === module.moduleCode)
      )
      if (!hasIt) continue
      const assignment = assignments.find((bm) => bm.branchName)
      branches.set(branchId, { branchPublicId: branchId, branchName: assignment?.branchName ?? "" })
    }
    const assignedBranches = [...branches.values()]
    result[moduleUsageKey(module)] = {
      quantity: module.quantity,
      used: assignedBranches.length,
      assignedBranches,
    }
  }
  return result
}

/**
 * Uso leído directo de /api/tenant-modules cuando el backend ya lo envía
 * (`assignedBranches` o `assignedCount`). Devuelve null si algún módulo por
 * sucursal no lo trae: en ese caso hay que calcularlo.
 */
export function usageFromTenantModules(tenantModules: TenantModuleResponseDto[]): ModuleUsageMap | null {
  const result: ModuleUsageMap = {}
  for (const module of tenantModules.filter(consumesLicense)) {
    let usage: ModuleUsage
    if (Array.isArray(module.assignedBranches)) {
      const assignedBranches = module.assignedBranches.map((branch) => ({
        branchPublicId: branch.branchPublicId ?? branch.id ?? "",
        branchName: branch.branchName ?? branch.name ?? "",
      }))
      usage = { quantity: module.quantity, used: assignedBranches.length, assignedBranches }
    } else if (typeof module.assignedCount === "number") {
      usage = { quantity: module.quantity, used: module.assignedCount, assignedBranches: [] }
    } else {
      return null
    }
    result[moduleUsageKey(module)] = usage
  }
  return result
}

/** Estado de licencias de un módulo para la sucursal actual. Sin datos de uso no se bloquea nada. */
export function licenseState(usage: ModuleUsage | undefined, currentBranchHasIt: boolean): LicenseState {
  if (!usage) {
    return { used: 0, total: null, free: null, unlimited: true, exhausted: false, canEnable: true }
  }
  const unlimited = usage.quantity === null || usage.quantity <= 0
  const total = unlimited ? null : usage.quantity
  const free = total === null ? null : Math.max(0, total - usage.used)
  const exhausted = free === 0
  return {
    used: usage.used,
    total,
    free,
    unlimited,
    exhausted,
    canEnable: currentBranchHasIt || !exhausted,
  }
}
