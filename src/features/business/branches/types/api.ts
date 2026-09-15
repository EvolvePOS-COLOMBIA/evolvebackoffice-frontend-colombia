/**
 * DTOs tal como los expone el backend (`/api/Branches`).
 * Fuente: Swagger de posco.ursposdemo.com, esquemas `BranchResponseDto`,
 * `CreateBranchDto` y `UpdateBranchDto`.
 */

export interface BranchResponseDto {
  id: string
  name: string | null
  identification: string | null
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  adminUserPublicId: string
  adminUserName: string | null
  createdAt: string
}

export interface CreateBranchDto {
  name: string | null
  adminUserId: string | null
  identification: string | null
  address: string | null
  phone: string | null
  email: string | null
}

export interface UpdateBranchDto {
  name: string | null
  identification: string | null
  address: string | null
  phone: string | null
  email: string | null
  adminUserId: string | null
}

/**
 * `GET /api/Branches` acepta `pageNumber` y `pageSize`, pero el Swagger no
 * documenta el cuerpo del 200 (el controlador devuelve un `ActionResult` sin
 * tipar). Asumimos el mismo sobre paginado que `/api/Tenants` y normalizamos
 * defensivamente en el servicio, que también acepta un array plano.
 */
export interface PagedBranchesResponse {
  data: BranchResponseDto[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}
