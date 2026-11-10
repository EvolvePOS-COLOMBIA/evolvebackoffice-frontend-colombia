import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activateBranch,
  createBranch,
  deactivateBranch,
  getBranches,
  getBranchesCount,
  updateBranch,
} from "@/features/business/branches/services/branches.service"
import type { BranchListOptions } from "@/features/business/branches/services/branches.service"
import type { CreateBranchDto, UpdateBranchDto } from "@/features/business/branches/types/api"

export const branchesKeys = {
  all: ["branches"] as const,
  list: (page: number, pageSize: number, options: BranchListOptions) =>
    ["branches", "list", page, pageSize, options] as const,
  count: (tenantId: string | null) => ["branches", "count", tenantId] as const,
}

export function useBranches(page = 1, pageSize = 20, options: BranchListOptions = {}) {
  return useQuery({
    queryKey: branchesKeys.list(page, pageSize, options),
    queryFn: () => getBranches(page, pageSize, options),
  })
}

/**
 * Cuenta de sucursales del tenant. El onboarding la usa como heurística de
 * "este negocio nunca se configuró". `enabled` la deja apagada mientras no haya
 * tenant o mientras el flag local ya diga que el onboarding terminó.
 */
export function useBranchesCount(tenantId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: branchesKeys.count(tenantId),
    queryFn: () => getBranchesCount(),
    enabled: Boolean(tenantId) && enabled,
    staleTime: Infinity,
    retry: false,
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBranchDto) => createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all })
    },
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchDto }) => updateBranch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all })
    },
  })
}

export function useDeactivateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all })
    },
  })
}

export function useActivateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all })
    },
  })
}
