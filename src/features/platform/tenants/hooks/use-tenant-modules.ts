import { useQuery } from "@tanstack/react-query"

import { getTenantModules } from "@/features/platform/tenants/services/tenant-modules.service"

/**
 * Lista los módulos del tenant (solo lectura). La configuración de módulos se
 * edita desde el diálogo del tenant (`PUT /api/tenants/{id}` con `modules[]`).
 */
export function useTenantModules(token: string | undefined, tenantId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-modules", tenantId],
    queryFn: () => getTenantModules(token!, tenantId!),
    enabled: Boolean(token && tenantId),
  })
}
