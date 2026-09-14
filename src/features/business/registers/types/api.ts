export interface RegisterResponseDto {
  id: string
  name: string
  code: string
  status: "Active" | "Maintenance" | "Locked" | "Inactive"
  deviceIdentifier?: string | null
  serialCode?: string | null
  branchPublicId?: string | null
  branchName?: string | null
  lastActivityAt?: string | null
  createdAt: string
}

export interface CreateRegisterDto {
  name: string
  code: string
  branchPublicId: string
  deviceIdentifier?: string | null
  serialCode?: string | null
}

export interface UpdateRegisterDto {
  name: string
  branchPublicId: string
  deviceIdentifier?: string | null
  serialCode?: string | null
}

export type RegisterStatus = "Active" | "Maintenance" | "Locked" | "Inactive"

export interface PagedRegistersResponse {
  data: RegisterResponseDto[]
  totalCount: number
}
