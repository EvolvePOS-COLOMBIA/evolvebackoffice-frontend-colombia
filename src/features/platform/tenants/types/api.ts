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

export interface CreateTenantResponseDto {
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
  serialCodes: PosSerialCodeResponseDto[] | null
  createdAt: string
  adminUsername: string | null
  adminTemporaryPassword: string | null
  adminTemporaryPin: string | null
}

export interface UpdateTenantDto {
  name: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  subdomain: string | null
  identificationNumber: string | null
  identificationTypeId: number | null
  maxRegisters: number | null
  maxBranches: number | null
  maxUsers: number | null
}

export interface PosSerialCodeResponseDto {
  id: string
  serialCode: string | null
  status: string | null
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
  status: string
  createdById: string | null
  rejectionReason: string | null
  approvedAt: string | null
  rejectedAt: string | null
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
  status: string
  createdById: string | null
  rejectionReason: string | null
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

export interface BulkUpdateTenantModuleItemDto {
  modulePublicId: string
  isEnabled: boolean
  quantity: number
}

export interface BulkUpdateTenantModulesDto {
  modules: BulkUpdateTenantModuleItemDto[]
}

export interface ModuleResponseDto {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
}

export interface DecommissionSerialDto {
  reason?: string | null
}

export interface ResetAdminCredentialsResponseDto {
  username: string | null
  temporaryPassword: string | null
  resetAt: string
}

export interface CanCreateRegisterResponseDto {
  tenantId: string
  canCreateRegister: boolean
}

export interface AdjustSerialCodesDto {
  newMaxRegisters: number
  serialsToDecommission?: string[] | null
}

export interface SerialCodeAdjustmentResultDto {
  previousMax: number
  newMax: number
  serialsGenerated: number
  serialsDecommissioned: number
  generatedSerials: PosSerialCodeResponseDto[]
  decommissionedSerials: PosSerialCodeResponseDto[]
}
