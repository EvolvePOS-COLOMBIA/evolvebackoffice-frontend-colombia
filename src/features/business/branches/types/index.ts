export type { BranchResponseDto, CreateBranchDto, UpdateBranchDto, PagedBranchesResponse } from "./api"

/** Modelo de sucursal que consume la UI (sin nulls sueltos). */
export interface Branch {
  id: string
  name: string
  identification: string
  address: string
  phone: string
  email: string
  isActive: boolean
  adminUserId: string
  adminUserName: string
  createdAt: string
  /** Zona horaria IANA (null = hereda la sede). */
  timeZoneId?: string | null
}

export interface PagedBranches {
  data: Branch[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface BranchFormValues {
  name: string
  identification: string
  address: string
  phone: string
  email: string
  adminUserId: string
}
