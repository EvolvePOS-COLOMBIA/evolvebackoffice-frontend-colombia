import { api } from "@/config/axios-client"
import type { AuditFilters, AuditTenantOption, PagedAuditResponse } from "../types"

function buildParams(filters: AuditFilters): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  }

  if (filters.tenantId) params.tenantId = filters.tenantId
  if (filters.action) params.action = filters.action
  if (filters.entityType?.trim()) params.entityType = filters.entityType.trim()
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.succeeded !== undefined) params.succeeded = filters.succeeded

  return params
}

export async function getAuditLogs(filters: AuditFilters): Promise<PagedAuditResponse> {
  const response = await api.get<PagedAuditResponse>("/api/logs/audit", {
    params: buildParams(filters),
  })
  return response.data
}

export async function getAuditTenants(limit = 100): Promise<AuditTenantOption[]> {
  const response = await api.get<AuditTenantOption[]>("/api/logs/audit/tenants", {
    params: { limit },
  })
  return response.data
}
