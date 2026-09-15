import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activateBranchTerminals,
  deactivateBranchTerminals,
  getBranchTerminalSettings,
  listBranchRegisters,
  upsertBranchTerminalSettings,
} from "@/features/business/branches/services/branch-terminals.service"
import type { UpsertBranchTerminalSettingsDto } from "@/features/business/branches/types/terminals-api"
import type { RegisterResponseDto } from "@/features/business/registers/types/api"

export const branchTerminalsKeys = {
  all: ["branch-terminals"] as const,
  settings: (branchId: string) => ["branch-terminals", "settings", branchId] as const,
  registers: (branchId: string) => ["branch-terminals", "registers", branchId] as const,
}

export function useBranchTerminalSettings(branchId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: branchTerminalsKeys.settings(branchId ?? ""),
    queryFn: () => getBranchTerminalSettings(branchId!),
    enabled: Boolean(branchId) && enabled,
    staleTime: 60 * 1000,
  })
}

export function useUpsertBranchTerminalSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: UpsertBranchTerminalSettingsDto }) =>
      upsertBranchTerminalSettings(branchId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: branchTerminalsKeys.settings(variables.branchId),
      })
    },
  })
}

export function useDeactivateBranchTerminals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (branchId: string) => deactivateBranchTerminals(branchId),
    onSuccess: (_data, branchId) => {
      queryClient.invalidateQueries({
        queryKey: branchTerminalsKeys.settings(branchId),
      })
      queryClient.invalidateQueries({
        queryKey: ["registers"],
      })
    },
  })
}

export function useActivateBranchTerminals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (branchId: string) => activateBranchTerminals(branchId),
    onSuccess: (_data, branchId) => {
      queryClient.invalidateQueries({
        queryKey: branchTerminalsKeys.settings(branchId),
      })
      queryClient.invalidateQueries({
        queryKey: ["registers"],
      })
    },
  })
}

export function useBranchRegisters(branchId: string | null | undefined, enabled = true) {
  return useQuery<RegisterResponseDto[]>({
    queryKey: branchTerminalsKeys.registers(branchId ?? ""),
    queryFn: () => listBranchRegisters(branchId!),
    enabled: Boolean(branchId) && enabled,
  })
}
