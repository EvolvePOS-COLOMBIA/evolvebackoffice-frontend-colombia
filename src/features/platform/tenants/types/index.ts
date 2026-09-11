import type { PosSerialCodeResponseDto } from "./api"

export interface Tenant {
  id: string
  name: string
  tenantId: string
  contactEmail: string
  phone: string
  address: string
  isActive: boolean
  maxRegisters: number
  currentRegisterCount: number
  subdomain: string
  identificationNumber: string
  identificationTypeId: number
  maxBranches: number
  maxUsers: number
  serialCodes: PosSerialCodeResponseDto[]
  createdAt: string
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
  maxRegisters: number
  adminIdentification: string
  subdomain: string
  identificationNumber: string
  identificationTypeId: number
  maxBranches: number
  maxUsers: number
  modules: TenantModuleAssignment[]
}
