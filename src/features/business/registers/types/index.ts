export type {
  RegisterResponseDto,
  CreateRegisterDto,
  UpdateRegisterDto,
  RegisterStatus,
  PagedRegistersResponse,
} from "./api"

export interface Register {
  id: string
  name: string
  code: string
  status: "Active" | "Maintenance" | "Locked" | "Inactive"
  deviceIdentifier: string
  serialCode: string
  branchPublicId: string
  branchName: string
  lastActivityAt: string
  createdAt: string
}

export interface PagedRegisters {
  data: Register[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface RegisterFormValues {
  name: string
  code: string
  branchPublicId: string
  deviceIdentifier: string
  serialCode: string
}
