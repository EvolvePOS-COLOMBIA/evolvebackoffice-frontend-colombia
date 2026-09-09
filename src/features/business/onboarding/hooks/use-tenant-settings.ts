import { useQuery } from "@tanstack/react-query"

import { getTenantSettings } from "../services/onboarding.service"

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => getTenantSettings(),
  })
}
