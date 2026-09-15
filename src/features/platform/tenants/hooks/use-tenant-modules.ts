import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getTenantModules, updateTenantModule } from "@/features/platform/tenants/services/tenant-modules.service"
import type { UpdateTenantModuleDto } from "@/features/platform/tenants/types/api"
import type { TenantModule } from "@/features/platform/tenants/types"

export function useTenantModules(token: string | undefined, tenantId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-modules", tenantId],
    queryFn: () => getTenantModules(token!, tenantId!),
    enabled: Boolean(token && tenantId),
  })
}

export function useUpdateTenantModule(token: string | undefined, tenantId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ modulePublicId, body }: { modulePublicId: string; body: UpdateTenantModuleDto }) =>
      updateTenantModule(token!, tenantId!, modulePublicId, body),
    onSuccess: (updatedModule: TenantModule) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-modules", tenantId] })
      return updatedModule
    },
  })
}
