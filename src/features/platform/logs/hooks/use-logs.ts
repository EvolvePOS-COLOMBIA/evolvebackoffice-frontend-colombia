import { useMutation, useQuery } from "@tanstack/react-query"

import { explainLog, getLog, getLogSummary, getLogTenants, getLogs } from "../services/log.service"
import type { LogsFilters } from "../types"

export const systemLogsKeys = {
  all: ["system-logs"] as const,
  list: (filters: LogsFilters) => ["system-logs", "list", filters] as const,
  summary: (hours: number) => ["system-logs", "summary", hours] as const,
  tenants: () => ["system-logs", "tenants"] as const,
  detail: (id: number) => ["system-logs", "detail", id] as const,
}

export function useLogs(filters: LogsFilters, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: systemLogsKeys.list(filters),
    queryFn: () => getLogs(filters),
    refetchInterval,
    placeholderData: (previous) => previous,
  })
}

export function useLogSummary(refetchInterval: number | false = false) {
  return useQuery({
    queryKey: systemLogsKeys.summary(24),
    queryFn: () => getLogSummary(24),
    refetchInterval,
    placeholderData: (previous) => previous,
  })
}

export function useLogTenants() {
  return useQuery({
    queryKey: systemLogsKeys.tenants(),
    queryFn: () => getLogTenants(100),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogDetail(id: number | null) {
  return useQuery({
    queryKey: systemLogsKeys.detail(id ?? -1),
    queryFn: () => getLog(id as number),
    enabled: id !== null,
  })
}

export function useExplainLog() {
  return useMutation({
    mutationFn: (id: number) => explainLog(id),
  })
}
