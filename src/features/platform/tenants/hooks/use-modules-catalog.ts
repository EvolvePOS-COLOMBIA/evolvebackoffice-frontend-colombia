import { useQuery } from "@tanstack/react-query"

import { getAllModules } from "@/features/platform/tenants/services/modules-catalog.service"

export function useModulesCatalog(token: string | undefined) {
  return useQuery({
    queryKey: ["modules-catalog"],
    queryFn: () => getAllModules(token!),
    enabled: Boolean(token),
  })
}
