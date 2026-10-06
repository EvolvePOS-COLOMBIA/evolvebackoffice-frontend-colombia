import type { PosSerialCodeResponseDto } from "./api"

export interface Tenant {
  id: string
  name: string
  tenantId: string
  contactEmail: string
  phone: string
  address: string
  countryCode: string | null
  isActive: boolean
  status: string
  createdById: string | null
  rejectionReason: string | null
  approvedAt: string | null
  rejectedAt: string | null
  maxRegisters: number
  currentRegisterCount: number
  subdomain: string
  identificationNumber: string
  identificationTypeId: number
  maxBranches: number
  maxUsers: number
  serialCodes: PosSerialCodeResponseDto[]
  createdAt: string
  /** Datos del primer usuario administrador (solo disponibles vía GET por id). */
  adminUsername?: string | null
  adminFullName?: string | null
  adminEmail?: string | null
  adminIdentification?: string | null
  adminIsActive?: boolean | null
  /** Zona horaria IANA del negocio (null = UTC). */
  timeZoneId?: string | null
}

export interface PagedTenantsResponse {
  data: Tenant[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface TenantModule {
  id: string
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleDescription?: string | null
  isEnabled: boolean
  quantity: number
  createdAt: string
}

export interface CatalogModule {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
}

export interface TenantModuleAssignment {
  moduleId: string
  isEnabled: boolean
  quantity: number
}

export interface TenantFormValues {
  name: string
  contactEmail: string
  phone: string
  address: string
  countryCode: string
  maxRegisters: number
  adminIdentification: string
  subdomain: string
  identificationNumber: string
  identificationTypeId: number
  maxBranches: number
  maxUsers: number
  modules: TenantModuleAssignment[]
  /** Zona horaria IANA; vacío = automática según país (UTC si no hay país). */
  timeZoneId: string
}
