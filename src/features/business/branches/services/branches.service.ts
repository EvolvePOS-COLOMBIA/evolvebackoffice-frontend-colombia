import { api } from "@/config/axios-client"
import type {
  BranchResponseDto,
  CreateBranchDto,
  PagedBranchesResponse,
  UpdateBranchDto,
} from "@/features/business/branches/types/api"
import type { Branch, PagedBranches } from "@/features/business/branches/types"

// El adaptador es la frontera entre los DTO del Swagger y el modelo que usa la UI.
function mapBranchResponseToBranch(dto: BranchResponseDto): Branch {
  return {
    id: dto.id,
    name: dto.name ?? "",
    identification: dto.identification ?? "",
    address: dto.address ?? "",
    phone: dto.phone ?? "",
    email: dto.email ?? "",
    isActive: dto.isActive,
    adminUserId: dto.adminUserPublicId,
    adminUserName: dto.adminUserName ?? "",
    createdAt: dto.createdAt,
  }
}

/**
 * El Swagger no documenta el cuerpo del 200 de `GET /api/Branches`, así que
 * aceptamos tanto el sobre paginado como un array plano. Si el backend define
 * una sola forma, este normalizador se puede simplificar.
 */
function normalizePagedResponse(
  payload: PagedBranchesResponse | BranchResponseDto[] | null | undefined,
  pageNumber: number,
  pageSize: number
): PagedBranches {
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapBranchResponseToBranch),
      pageNumber,
      pageSize,
      totalCount: payload.length,
      totalPages: 1,
    }
  }

  const items = payload?.data ?? []

  return {
    data: items.map(mapBranchResponseToBranch),
    pageNumber: payload?.pageNumber ?? pageNumber,
    pageSize: payload?.pageSize ?? pageSize,
    totalCount: payload?.totalCount ?? items.length,
    totalPages: payload?.totalPages ?? 1,
  }
}

export async function getBranches(pageNumber = 1, pageSize = 20): Promise<PagedBranches> {
  const { data } = await api.get<PagedBranchesResponse | BranchResponseDto[]>("/api/Branches", {
    params: { pageNumber, pageSize },
  })

  return normalizePagedResponse(data, pageNumber, pageSize)
}

/** Usado por el gate del onboarding: solo necesita saber si hay alguna sucursal. */
export async function getBranchesCount(): Promise<number> {
  const page = await getBranches(1, 1)
  return page.totalCount
}

export async function getBranchById(id: string): Promise<Branch> {
  const { data } = await api.get<BranchResponseDto>(`/api/Branches/${id}`)
  return mapBranchResponseToBranch(data)
}

export async function createBranch(payload: CreateBranchDto): Promise<Branch> {
  const { data } = await api.post<BranchResponseDto>("/api/Branches", payload)
  return mapBranchResponseToBranch(data)
}

export async function updateBranch(id: string, payload: UpdateBranchDto): Promise<Branch> {
  const { data } = await api.put<BranchResponseDto>(`/api/Branches/${id}`, payload)
  return mapBranchResponseToBranch(data)
}
