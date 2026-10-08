import { useQuery } from "@tanstack/react-query"

import { getAuditLogs, getAuditTenants } from "../services/audit.service"
import type { AuditFilters } from "../types"

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (filters: AuditFilters) => ["audit-logs", "list", filters] as const,
  tenants: () => ["audit-logs", "tenants"] as const,
}

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => getAuditLogs(filters),
    placeholderData: (previous) => previous,
  })
}

export function useAuditTenants() {
  return useQuery({
    queryKey: auditKeys.tenants(),
    queryFn: () => getAuditTenants(100),
    staleTime: 5 * 60 * 1000,
  })
}
