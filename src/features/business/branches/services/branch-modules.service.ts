import { api } from "@/config/axios-client"

import type {
  AssignModuleBody,
  BranchModuleResponseDto,
  ModuleUsageMap,
  TenantModuleResponseDto,
} from "../types/modules"
import { computeModuleUsage, usageFromTenantModules } from "../utils/module-usage"
import { getBranches } from "./branches.service"

/**
 * Servicio de módulos de sucursal.
 *
 * Endpoints del backend:
 * - GET  /api/tenant-modules                   → módulos disponibles del tenant
 * - GET  /api/Branches/{id}/modules            → módulos asignados a una sucursal
 * - POST /api/Branches/{id}/modules            → asignar un módulo (body: { tenantModulePublicId })
 * - DELETE /api/Branches/{id}/modules/{moduleId} → quitar un módulo
 */

/* ------------------------------------------------------------------ */
/*  Helpers — normalizar respuestas                                   */
/* ------------------------------------------------------------------ */

type PagedResponse<T> = {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Acepta tanto un array plano como un sobre paginado. */
function normalizeArray<T>(payload: PagedResponse<T> | T[] | null | undefined): T[] {
  if (Array.isArray(payload)) return payload
  return payload?.data ?? []
}

/* ------------------------------------------------------------------ */
/*  Tenant modules — catálogo disponible                              */
/* ------------------------------------------------------------------ */

/** Lista los módulos asignados al tenant actual. */
export async function getTenantModules(): Promise<TenantModuleResponseDto[]> {
  const { data } = await api.get<PagedResponse<TenantModuleResponseDto> | TenantModuleResponseDto[]>(
    "/api/tenant-modules"
  )
  return normalizeArray(data)
}

/* ------------------------------------------------------------------ */
/*  Branch modules — asignación por sucursal                          */
/* ------------------------------------------------------------------ */

/** Lista los módulos asignados a una sucursal. */
export async function getBranchModules(branchId: string): Promise<BranchModuleResponseDto[]> {
  const { data } = await api.get<PagedResponse<BranchModuleResponseDto> | BranchModuleResponseDto[]>(
    `/api/Branches/${branchId}/modules`
  )
  return normalizeArray(data)
}

/** Asigna un módulo del tenant a una sucursal. */
export async function assignModuleToBranch(
  branchId: string,
  tenantModulePublicId: string
): Promise<BranchModuleResponseDto> {
  const body: AssignModuleBody = { tenantModulePublicId }
  const { data } = await api.post<BranchModuleResponseDto>(`/api/Branches/${branchId}/modules`, body)
  return data
}

/** Quita un módulo de una sucursal. */
export async function removeModuleFromBranch(branchId: string, modulePublicId: string): Promise<void> {
  await api.delete(`/api/Branches/${branchId}/modules/${modulePublicId}`)
}

/* ------------------------------------------------------------------ */
/*  Uso de licencias por módulo                                       */
/* ------------------------------------------------------------------ */

const BRANCH_PAGE_SIZE = 100

/** Ids de todas las sucursales del tenant, recorriendo las páginas. */
async function getAllBranchIds(): Promise<string[]> {
  const first = await getBranches(1, BRANCH_PAGE_SIZE)
  const ids = first.data.map((branch) => branch.id)
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await getBranches(page, BRANCH_PAGE_SIZE)
    ids.push(...next.data.map((branch) => branch.id))
  }
  return ids
}

/**
 * Licencias en uso por módulo. Si /api/tenant-modules ya trae el uso
 * (`assignedBranches` o `assignedCount`) se usa directo; mientras el backend no
 * lo envíe se calcula consultando los módulos de cada sucursal. El cambio es
 * interno: la UI consume siempre el mismo ModuleUsageMap.
 */
export async function getModuleUsage(): Promise<ModuleUsageMap> {
  const tenantModules = await getTenantModules()
  const direct = usageFromTenantModules(tenantModules)
  if (direct) return direct

  const branchIds = await getAllBranchIds()
  const lists = await Promise.all(branchIds.map((id) => getBranchModules(id)))
  const byBranch: Record<string, BranchModuleResponseDto[]> = {}
  branchIds.forEach((id, index) => {
    byBranch[id] = lists[index]
  })
  return computeModuleUsage(tenantModules, byBranch)
}
