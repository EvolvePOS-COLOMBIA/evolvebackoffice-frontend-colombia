import { api } from "@/config/axios-client"
import type {
  CreateRegisterDto,
  PagedRegistersResponse,
  RegisterResponseDto,
  RegisterStatus,
  UpdateRegisterDto,
} from "@/features/business/registers/types/api"
import type { PagedRegisters, Register } from "@/features/business/registers/types"

const PAGE_SIZE_DEFAULT = 10

function mapDtoToRegister(dto: RegisterResponseDto): Register {
  return {
    id: dto.id,
    name: dto.name ?? "",
    code: dto.code ?? "",
    status: dto.status,
    deviceIdentifier: dto.deviceIdentifier ?? "",
    serialCode: dto.serialCode ?? "",
    branchPublicId: dto.branchPublicId ?? "",
    branchName: dto.branchName ?? "",
    lastActivityAt: dto.lastActivityAt ?? "",
    createdAt: dto.createdAt,
  }
}

function normalizePagedResponse(
  payload: PagedRegistersResponse | RegisterResponseDto[] | null | undefined,
  pageNumber: number,
  pageSize: number
): PagedRegisters {
  if (Array.isArray(payload)) {
    const totalCount = payload.length
    return {
      data: payload.map(mapDtoToRegister),
      pageNumber,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    }
  }

  const items = payload?.data ?? []
  const totalCount = payload?.totalCount ?? items.length

  return {
    data: items.map(mapDtoToRegister),
    pageNumber,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

export async function getRegisters(
  pageNumber = 1,
  pageSize = PAGE_SIZE_DEFAULT
): Promise<PagedRegisters> {
  const { data } = await api.get<PagedRegistersResponse | RegisterResponseDto[]>("/api/registers", {
    params: { pageNumber, pageSize },
  })

  return normalizePagedResponse(data, pageNumber, pageSize)
}

export async function getRegisterById(id: string): Promise<Register> {
  const { data } = await api.get<RegisterResponseDto>(`/api/registers/${id}`)
  return mapDtoToRegister(data)
}

export async function createRegister(dto: CreateRegisterDto): Promise<Register> {
  const { data } = await api.post<RegisterResponseDto>("/api/registers", dto)
  return mapDtoToRegister(data)
}

export async function updateRegister(id: string, dto: UpdateRegisterDto): Promise<Register> {
  const { data } = await api.put<RegisterResponseDto>(`/api/registers/${id}`, dto)
  return mapDtoToRegister(data)
}

export async function setRegisterStatus(id: string, status: RegisterStatus): Promise<void> {
  await api.post(`/api/registers/${id}/status`, undefined, {
    params: { status },
  })
}
