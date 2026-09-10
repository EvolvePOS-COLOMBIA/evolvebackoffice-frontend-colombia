import { api } from "@/config/axios-client"
import type {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
  PagedTenantListResponse,
} from "@/features/platform/tenants/types/api"
import type { Tenant, PagedTenantsResponse } from "@/features/platform/tenants/types"

function mapTenantResponseToTenant(dto: TenantResponseDto): Tenant {
  return {
    id: dto.id,
    name: dto.name ?? "",
    tenantId: dto.tenantId ?? "",
    contactEmail: dto.contactEmail ?? "",
    phone: dto.phone ?? "",
    address: dto.address ?? "",
    isActive: dto.isActive,
    maxRegisters: dto.maxRegisters,
    currentRegisterCount: dto.currentRegisterCount,
    subdomain: dto.subdomain ?? "",
    identificationNumber: dto.identificationNumber ?? "",
    identificationTypeId: dto.identificationTypeId ?? 0,
    maxBranches: dto.maxBranches ?? 0,
    maxUsers: dto.maxUsers ?? 0,
    createdAt: dto.createdAt,
  }
}

function mapListResponseToPagedTenants(dto: PagedTenantListResponse): PagedTenantsResponse {
  return {
    data: dto.data.map((item) => ({
      id: item.id,
      name: item.name ?? "",
      tenantId: item.tenantId ?? "",
      contactEmail: item.contactEmail ?? "",
      phone: "",
      address: "",
      isActive: item.isActive,
      maxRegisters: item.maxRegisters,
      currentRegisterCount: 0,
      subdomain: "",
      identificationNumber: "",
      identificationTypeId: 0,
      maxBranches: 0,
      maxUsers: 0,
      createdAt: item.createdAt,
    })),
    pageNumber: dto.pageNumber,
    pageSize: dto.pageSize,
    totalCount: dto.totalCount,
    totalPages: dto.totalPages,
  }
}

export async function getTenants(page: number, pageSize: number): Promise<PagedTenantsResponse> {
  const response = await api.get<PagedTenantListResponse>("/api/Tenants", {
    params: { pageNumber: page, pageSize },
  })
  return mapListResponseToPagedTenants(response.data)
}

export async function createTenant(data: CreateTenantDto): Promise<Tenant> {
  const response = await api.post<TenantResponseDto>("/api/Tenants", data)
  return mapTenantResponseToTenant(response.data)
}

export async function getTenant(id: string): Promise<Tenant> {
  const response = await api.get<TenantResponseDto>(`/api/Tenants/${id}`)
  return mapTenantResponseToTenant(response.data)
}

export async function updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant> {
  const response = await api.put<TenantResponseDto>(`/api/Tenants/${id}`, data)
  return mapTenantResponseToTenant(response.data)
}

export async function activateTenant(id: string): Promise<void> {
  await api.post(`/api/Tenants/${id}/activate`)
}

export async function deactivateTenant(id: string): Promise<void> {
  await api.post(`/api/Tenants/${id}/deactivate`)
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/api/Tenants/${id}`)
}
