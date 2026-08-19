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
  createdAt: string
}

export interface TenantFormValues {
  name: string
  contactEmail: string
  phone: string
  address: string
  maxRegisters: number
}

export interface PagedTenantsResponse {
  data: Tenant[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}
