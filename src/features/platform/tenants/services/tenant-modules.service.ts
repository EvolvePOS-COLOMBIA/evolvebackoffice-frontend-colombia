import axios from "axios"

import { appConfig } from "@/config/env"
import type {
  TenantModuleDto,
  UpdateTenantModuleDto,
} from "@/features/platform/tenants/types/api"
import type { TenantModule } from "@/features/platform/tenants/types"

type PagedResponse<T> = {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

function normalizeArray<T>(payload: PagedResponse<T> | T[] | null | undefined): T[] {
  if (Array.isArray(payload)) return payload
  return payload?.data ?? []
}

function mapDtoToTenantModule(dto: TenantModuleDto): TenantModule {
  return {
    id: dto.id,
    moduleId: dto.moduleId,
    moduleCode: dto.moduleCode,
    moduleName: dto.moduleName,
    moduleDescription: dto.moduleDescription,
    isEnabled: dto.isEnabled,
    quantity: dto.quantity,
    createdAt: dto.createdAt,
  }
}

function createPlatformClient(token: string, tenantId: string) {
  return axios.create({
    baseURL: appConfig.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Tenant-Id": tenantId,
    },
  })
}

export async function getTenantModules(
  token: string,
  tenantId: string
): Promise<TenantModule[]> {
  const client = createPlatformClient(token, tenantId)
  const { data } = await client.get<PagedResponse<TenantModuleDto> | TenantModuleDto[]>(
    "/api/tenant-modules"
  )
  const items = normalizeArray(data)
  return items.map(mapDtoToTenantModule)
}

export async function updateTenantModule(
  token: string,
  tenantId: string,
  modulePublicId: string,
  body: UpdateTenantModuleDto
): Promise<TenantModule> {
  const client = createPlatformClient(token, tenantId)
  const { data } = await client.put<TenantModuleDto>(
    `/api/tenant-modules/${modulePublicId}`,
    body
  )
  return mapDtoToTenantModule(data)
}
