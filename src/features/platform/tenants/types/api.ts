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
  adminDocumentType?: DocumentType
  adminDocumentNumber?: string | null
}

export interface UpdateTenantDto {
  name: string
  contactEmail: string
  phone: string | null
  address: string | null
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
  isActive: boolean
  maxRegisters: number
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
