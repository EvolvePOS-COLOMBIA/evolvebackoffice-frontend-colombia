import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createBranchIntegration,
  deleteBranchIntegration,
  listBranchIntegrations,
  testBranchIntegrationConnection,
  updateBranchIntegration,
} from "@/features/business/branches/services/branch-integrations.service"
import type {
  CreateBranchIntegrationDto,
  PlatformCode,
  UpdateBranchIntegrationDto,
} from "@/features/business/branches/types/integrations-api"

export const integrationsKeys = {
  all: ["branch-integrations"] as const,
  list: (branchId: string) => ["branch-integrations", "list", branchId] as const,
}

/** List all integrations for a branch. */
export function useBranchIntegrations(branchId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: integrationsKeys.list(branchId ?? ""),
    queryFn: () => listBranchIntegrations(branchId!),
    enabled: Boolean(branchId) && enabled,
    staleTime: 60_000,
  })
}

/** Find integration by platform code from the list. */
export function useBranchIntegrationByPlatform(
  branchId: string | null | undefined,
  platformCode: PlatformCode
) {
  const { data: integrations, ...rest } = useBranchIntegrations(branchId)
  const integration = integrations?.find((i) => i.platformCode === platformCode) ?? null
  return { data: integration, ...rest }
}

/** Create a new integration for a branch. */
export function useCreateBranchIntegration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      dto,
    }: {
      branchId: string
      dto: CreateBranchIntegrationDto
    }) => createBranchIntegration(branchId, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationsKeys.list(variables.branchId) })
    },
  })
}

/** Update an existing integration. */
export function useUpdateBranchIntegration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      id,
      dto,
    }: {
      branchId: string
      id: string
      dto: UpdateBranchIntegrationDto
    }) => updateBranchIntegration(branchId, id, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationsKeys.list(variables.branchId) })
    },
  })
}

/** Delete (soft) an integration. */
export function useDeleteBranchIntegration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      id,
    }: {
      branchId: string
      id: string
    }) => deleteBranchIntegration(branchId, id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationsKeys.list(variables.branchId) })
    },
  })
}

/** Test connectivity to the external platform. */
export function useTestBranchIntegrationConnection() {
  return useMutation({
    mutationFn: ({
      branchId,
      id,
    }: {
      branchId: string
      id: string
    }) => testBranchIntegrationConnection(branchId, id),
  })
}
