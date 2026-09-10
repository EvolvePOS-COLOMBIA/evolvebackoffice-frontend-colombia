export enum DocumentType {
  CedulaCiudadania = 0,
  CedulaExtranjeria = 1,
  NIT = 2,
  TarjetaIdentidad = 3,
  Pasaporte = 4,
}

export interface CreateTenantDto {
  name: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  maxRegisters: number | null
  adminIdentification: string | null
  subdomain: string | null
  identificationNumber: string | null
  identificationTypeId: number
  maxBranches: number | null
  maxUsers: number | null
}

export interface UpdateTenantDto {
  name: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  subdomain: string | null
  identificationNumber: string | null
  identificationTypeId: number | null
  maxBranches: number | null
  maxUsers: number | null
}

export interface PosSerialCodeResponseDto {
  id: string
  serialCode: string
  status: string
  machineIdentifier: string | null
  deviceName: string | null
  activatedAt: string | null
  lastSeenAt: string | null
  createdAt: string
}

export interface TenantResponseDto {
  id: string
  name: string | null
  tenantId: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  identificationNumber: string | null
  identificationTypeId: number
  subdomain: string | null
  isActive: boolean
  maxRegisters: number
  maxBranches: number | null
  maxUsers: number | null
  currentRegisterCount: number
  serialCodes: PosSerialCodeResponseDto[] | null
  createdAt: string
}

export interface TenantListResponseDto {
  id: string
  name: string | null
  tenantId: string | null
  contactEmail: string | null
  isActive: boolean
  maxRegisters: number
  createdAt: string
}

export interface PagedTenantListResponse {
  data: TenantListResponseDto[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface TenantModuleDto {
  id: string
  moduleId: string
  moduleCode: string
  moduleName: string
  moduleDescription?: string | null
  isEnabled: boolean
  quantity: number
  createdAt: string
}

export interface UpdateTenantModuleDto {
  isEnabled?: boolean
  quantity?: number
}

export interface ModuleResponseDto {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
}
