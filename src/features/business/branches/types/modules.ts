/**
 * DTOs de módulos tal como los expone el backend.
 * Fuente: Swagger de juacopizza.ursposdemo.com.
 */

/** Módulo asignado al tenant (`GET /api/tenant-modules`). */
export interface TenantModuleResponseDto {
  id: string
  moduleId: string
  moduleCode: string | null
  moduleName: string | null
  moduleDescription: string | null
  isEnabled: boolean
  quantity: number | null
  /** true = se asigna por sucursal; false = global del tenant (backend `ModuleScope`). */
  isBranchScoped?: boolean
  /** Aún no lo envía el backend: sedes que consumen una licencia. Si llega, se usa tal cual. */
  assignedBranches?: { branchPublicId?: string; id?: string; branchName?: string | null; name?: string | null }[]
  /** Aún no lo envía el backend: cantidad de licencias en uso (sin nombres de sede). */
  assignedCount?: number
}

/** Módulo asignado a una sucursal (`GET /api/Branches/{id}/modules`). */
export interface BranchModuleResponseDto {
  id: string
  branchPublicId: string
  branchName: string | null
  tenantModuleId: number
  /** PublicId del TenantModule (cruza con `GET /api/tenant-modules`). */
  tenantModulePublicId?: string
  moduleCode: string | null
  moduleName: string | null
  isEnabled: boolean
  createdAt: string
}

/** Body para `POST /api/Branches/{id}/modules`. */
export interface AssignModuleBody {
  tenantModulePublicId: string
}

/** Sede que consume una licencia de un módulo. */
export interface ModuleUsageBranch {
  branchPublicId: string
  branchName: string
}

/** Uso de licencias de un módulo por sucursal. */
export interface ModuleUsage {
  /** Licencias compradas; null o <= 0 = sin límite. */
  quantity: number | null
  /** Licencias en uso. Puede ser mayor que assignedBranches si el backend solo envía el conteo. */
  used: number
  assignedBranches: ModuleUsageBranch[]
}

/** Uso por módulo del tenant (clave: public id del tenant module, o código de módulo). */
export type ModuleUsageMap = Record<string, ModuleUsage>

/** Estado de licencias de un módulo respecto a una sucursal concreta. */
export interface LicenseState {
  used: number
  total: number | null
  /** null cuando es ilimitado. */
  free: number | null
  unlimited: boolean
  exhausted: boolean
  canEnable: boolean
}
