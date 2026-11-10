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
  isSupplier: boolean
  /** Coordenadas como texto; vacío cuando el backend no tiene datos. */
  latitude: string
  longitude: string
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
  latitude: string
  longitude: string
  adminUserId: string
  isSupplier: boolean
}
