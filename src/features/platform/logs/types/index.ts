export type SystemLogLevel = "Debug" | "Information" | "Warning" | "Error" | "Fatal"

export type SystemLogServiceStatus = "unknown" | "healthy" | "degraded" | "critical"

/** Fila del listado de logs (payload ligero; el detalle se trae por id). */
export interface SystemLogListItem {
  id: number
  timestampUtc: string
  level: SystemLogLevel
  message: string
  hasException: boolean
  exceptionPreview: string | null
  tenantId: string | null
  traceId: string | null
  requestMethod: string | null
  requestPath: string | null
  statusCode: number | null
  elapsedMs: number | null
  source: string | null
}

/** Detalle completo de un evento: mensaje, excepción y propiedades. */
export interface SystemLogDetail {
  id: number
  timestampUtc: string
  level: SystemLogLevel
  message: string
  messageTemplate: string | null
  exception: string | null
  tenantId: string | null
  traceId: string | null
  requestMethod: string | null
  requestPath: string | null
  statusCode: number | null
  elapsedMs: number | null
  source: string | null
  propertiesJson: string | null
  serviceName: string
  environment: string
  version: string
}

/** Resumen por niveles de la ventana consultada + estado del servicio. */
export interface SystemLogsSummary {
  windowHours: number
  total: number
  fatal: number
  errors: number
  warnings: number
  infos: number
  debugs: number
  requests: number
  avgElapsedMs: number | null
  lastErrorAt: string | null
  lastErrorTenantId: string | null
  lastErrorMessage: string | null
  status: SystemLogServiceStatus
}

/** Tenant con eventos registrados (combo de filtrado). */
export interface SystemLogTenantOption {
  tenantId: string
  count: number
}

export interface LogsFilters {
  pageNumber: number
  pageSize: number
  /** Nivel exacto (Debug|Information|Warning|Error|Fatal) o undefined = todos */
  level?: string
  tenantId?: string
  /** ISO UTC */
  from?: string
  /** ISO UTC */
  to?: string
  search?: string
  traceId?: string
}

export interface PagedLogsResponse {
  data: SystemLogListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Explicación de IA guardada de un evento (GET /api/logs/{id}/explanation). */
export interface SystemLogAiExplanation {
  systemLogId: number
  explanation: string
  createdUtc: string
  updatedUtc: string
}

/** Resultado de explicar un evento con IA (POST /api/logs/{id}/explain). */
export interface ExplainLogResult {
  explanation: string
  /** true = se devolvió la explicación guardada sin consumir el proveedor. */
  cached: boolean
  generatedAtUtc: string
}
