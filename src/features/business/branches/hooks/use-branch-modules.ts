import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  assignModuleToBranch,
  getBranchModules,
  getTenantModules,
  removeModuleFromBranch,
} from "@/features/business/branches/services/branch-modules.service"
import type { BranchModuleResponseDto, TenantModuleResponseDto } from "@/features/business/branches/types/modules"

export const branchModulesKeys = {
  all: ["branch-modules"] as const,
  tenant: () => ["branch-modules", "tenant"] as const,
  list: (branchId: string) => ["branch-modules", "list", branchId] as const,
}

/** Modules available at the tenant level (catalog for assignment). */
export function useTenantModules(enabled = true) {
  return useQuery<TenantModuleResponseDto[]>({
    queryKey: branchModulesKeys.tenant(),
    queryFn: getTenantModules,
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/** Modules currently assigned to a specific branch. */
export function useBranchModules(branchId: string | null | undefined, enabled = true) {
  return useQuery<BranchModuleResponseDto[]>({
    queryKey: branchModulesKeys.list(branchId ?? ""),
    queryFn: () => getBranchModules(branchId!),
    enabled: Boolean(branchId) && enabled,
    staleTime: 60_000,
  })
}

/** Assign a tenant module to a branch. */
export function useAssignModuleToBranch() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      tenantModulePublicId,
    }: {
      branchId: string
      tenantModulePublicId: string
    }) => assignModuleToBranch(branchId, tenantModulePublicId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: branchModulesKeys.list(variables.branchId) })
    },
  })
}

/** Remove a module from a branch. */
export function useRemoveModuleFromBranch() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      modulePublicId,
    }: {
      branchId: string
      modulePublicId: string
    }) => removeModuleFromBranch(branchId, modulePublicId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: branchModulesKeys.list(variables.branchId) })
    },
  })
}
