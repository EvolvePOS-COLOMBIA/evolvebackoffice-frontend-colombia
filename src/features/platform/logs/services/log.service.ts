import { api } from "@/config/axios-client"
import type {
  ExplainLogResult,
  LogsFilters,
  PagedLogsResponse,
  SystemLogAiExplanation,
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

/** Explicación de IA ya guardada del evento, sin consumir el proveedor (null si aún no existe). */
export async function getLogExplanation(id: number): Promise<SystemLogAiExplanation | null> {
  const response = await api.get<SystemLogAiExplanation | "">(`/api/logs/${id}/explanation`)
  return response.data ? (response.data as SystemLogAiExplanation) : null
}

/**
 * Explica un evento con IA. Por defecto devuelve la explicación guardada si ya
 * existe (cached=true); con refresh=true la regenera y la sobrescribe.
 */
export async function explainLog(id: number, refresh = false): Promise<ExplainLogResult> {
  const response = await api.post<ExplainLogResult>(`/api/logs/${id}/explain`, null, {
    params: refresh ? { refresh: true } : undefined,
  })
  return response.data
}
