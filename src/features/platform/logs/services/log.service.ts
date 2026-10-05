import { api } from "@/config/axios-client"
import type {
  LogsFilters,
  PagedLogsResponse,
  SystemLogDetail,
  SystemLogTenantOption,
  SystemLogsSummary,
} from "../types"

function buildParams(filters: LogsFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  }

  if (filters.level) params.level = filters.level
  if (filters.tenantId) params.tenantId = filters.tenantId
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.traceId?.trim()) params.traceId = filters.traceId.trim()

  return params
}

export async function getLogs(filters: LogsFilters): Promise<PagedLogsResponse> {
  const response = await api.get<PagedLogsResponse>("/api/logs", {
    params: buildParams(filters),
  })
  return response.data
}

export async function getLogSummary(hours = 24): Promise<SystemLogsSummary> {
  const response = await api.get<SystemLogsSummary>("/api/logs/summary", {
    params: { hours },
  })
  return response.data
}

export async function getLogTenants(limit = 100): Promise<SystemLogTenantOption[]> {
  const response = await api.get<SystemLogTenantOption[]>("/api/logs/tenants", {
    params: { limit },
  })
  return response.data
}

export async function getLog(id: number): Promise<SystemLogDetail> {
  const response = await api.get<SystemLogDetail>(`/api/logs/${id}`)
  return response.data
}

export async function explainLog(id: number): Promise<string> {
  const response = await api.post<{ explanation: string }>(`/api/logs/${id}/explain`)
  return response.data.explanation
}
