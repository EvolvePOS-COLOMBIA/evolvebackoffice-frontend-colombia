import { api } from "@/config/axios-client"
import type {
  BranchTerminalSettingsResponseDto,
  UpsertBranchTerminalSettingsDto,
} from "@/features/business/branches/types/terminals-api"
import type { RegisterResponseDto } from "@/features/business/registers/types/api"

export interface BranchTerminalSettings {
  id: string | null
  branchId: string
  maxTerminals: number
  areTerminalsEnabled: boolean
  createdAt: string
}

function mapDtoToSettings(dto: BranchTerminalSettingsResponseDto): BranchTerminalSettings {
  return {
    id: dto.id,
    branchId: dto.branchId,
    maxTerminals: dto.maxTerminals ?? 3,
    areTerminalsEnabled: dto.areTerminalsEnabled ?? true,
    createdAt: dto.createdAt,
  }
}

function withDefaults(branchId: string, dto?: BranchTerminalSettingsResponseDto | null): BranchTerminalSettings {
  if (!dto) {
    return {
      id: null,
      branchId,
      maxTerminals: 3,
      areTerminalsEnabled: true,
      createdAt: "",
    }
  }

  return {
    id: dto.id ?? null,
    branchId: dto.branchId ?? branchId,
    maxTerminals: dto.maxTerminals ?? 3,
    areTerminalsEnabled: dto.areTerminalsEnabled ?? true,
    createdAt: dto.createdAt ?? "",
  }
}

export async function getBranchTerminalSettings(branchPublicId: string): Promise<BranchTerminalSettings> {
  try {
    const { data } = await api.get<BranchTerminalSettingsResponseDto>(
      `/api/branches/${branchPublicId}/terminals/settings`
    )
    return withDefaults(branchPublicId, data)
  } catch {
    return withDefaults(branchPublicId, null)
  }
}

export async function upsertBranchTerminalSettings(
  branchPublicId: string,
  dto: UpsertBranchTerminalSettingsDto
): Promise<BranchTerminalSettings> {
  const { data } = await api.post<BranchTerminalSettingsResponseDto>(
    `/api/branches/${branchPublicId}/terminals/settings`,
    dto
  )
  return mapDtoToSettings(data)
}

export async function deactivateBranchTerminals(branchPublicId: string): Promise<void> {
  await api.post(`/api/branches/${branchPublicId}/terminals/deactivate`)
}

export async function activateBranchTerminals(branchPublicId: string): Promise<void> {
  await api.post(`/api/branches/${branchPublicId}/terminals/activate`)
}

export async function listBranchRegisters(branchPublicId: string): Promise<RegisterResponseDto[]> {
  const { data } = await api.get<RegisterResponseDto[] | { data: RegisterResponseDto[] }>(
    `/api/branches/${branchPublicId}/terminals`
  )
  if (Array.isArray(data)) return data
  return data?.data ?? []
}
