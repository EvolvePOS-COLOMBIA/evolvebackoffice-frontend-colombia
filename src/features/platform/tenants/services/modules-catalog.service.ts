import axios from "axios"

import { appConfig } from "@/config/env"
import type { ModuleResponseDto } from "@/features/platform/tenants/types/api"
import type { CatalogModule } from "@/features/platform/tenants/types"

function mapDtoToCatalogModule(dto: ModuleResponseDto): CatalogModule {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
  }
}

export async function getAllModules(token: string): Promise<CatalogModule[]> {
  const client = axios.create({
    baseURL: appConfig.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  const { data } = await client.get<ModuleResponseDto[]>("/api/modules")
  return data.map(mapDtoToCatalogModule)
}
