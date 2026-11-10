import type { EntityImageDto } from "../../catalog/types"

export interface Department {
  id: string
  internalId: number
  code: string
  name: string
  parentPublicId: string | null
  parentName: string | null
  isActive: boolean
  createdAt: string
  /** Galería ordenada: la posición 0 es la principal. */
  images?: EntityImageDto[]
}

export interface CreateDepartmentDto {
  code: string
  name: string
  parentPublicId?: string | null
}

export interface UpdateDepartmentDto {
  code: string
  name: string
  parentPublicId?: string | null
}

export interface PagedDepartments {
  data: Department[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}
