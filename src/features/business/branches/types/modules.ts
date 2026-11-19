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
