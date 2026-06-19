import { useQuery } from "@tanstack/react-query"

import { getDashboardSummary } from "@/features/dashboard/services/dashboard.service"

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
  })
}

