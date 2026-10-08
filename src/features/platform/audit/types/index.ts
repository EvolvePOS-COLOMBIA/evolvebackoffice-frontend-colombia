/** Fila de auditoría devuelta por GET /api/logs/audit. */
export interface AuditLogItem {
  id: string
  createdAtUtc: string
  /** Acción (identificador del enum, p. ej. EntityUpdated, Login, OrderClosed). */
  action: string
  /** Entidad CLR afectada (p. ej. Item, Order, User). */
  entityType: string
  entityPublicId: string | null
  actorPublicId: string | null
  actorName: string | null
  actorType: string
  tenantPublicId: string | null
  tenantId: string | null
  tenantName: string | null
  ipAddress: string | null
  userAgent: string | null
  traceId: string | null
  succeeded: boolean
  errorMessage: string | null
  /** JSON con los valores previos de las propiedades cambiadas. */
  oldValues: string | null
  /** JSON con los valores nuevos (o los valores vigentes en un borrado). */
  newValues: string | null
}

export interface AuditTenantOption {
  tenantPublicId: string
  tenantId: string
  name: string | null
  count: number
}

export interface AuditFilters {
  pageNumber: number
  pageSize: number
  tenantId?: string
  action?: string
  entityType?: string
  /** ISO UTC */
  from?: string
  /** ISO UTC */
  to?: string
  search?: string
  succeeded?: boolean
}

export interface PagedAuditResponse {
  data: AuditLogItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}
