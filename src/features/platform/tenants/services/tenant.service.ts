import { api } from "@/config/axios-client"
import type {
  CreateTenantDto,
  CreateTenantResponseDto,
  UpdateTenantDto,
  TenantResponseDto,
  PagedTenantListResponse,
  PosSerialCodeResponseDto,
  DecommissionSerialDto,
  ResetAdminCredentialsResponseDto,
  CanCreateRegisterResponseDto,
  AdjustSerialCodesDto,
  SerialCodeAdjustmentResultDto,
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
    countryCode: dto.countryCode ?? "",
    isActive: dto.isActive,
    status: dto.status ?? "Active",
    createdById: dto.createdById ?? null,
    rejectionReason: dto.rejectionReason ?? null,
    approvedAt: dto.approvedAt ?? null,
    rejectedAt: dto.rejectedAt ?? null,
    maxRegisters: dto.maxRegisters,
    currentRegisterCount: dto.currentRegisterCount,
    subdomain: dto.subdomain ?? "",
    identificationNumber: dto.identificationNumber ?? "",
    identificationTypeId: dto.identificationTypeId ?? 0,
    maxBranches: dto.maxBranches ?? 0,
    maxUsers: dto.maxUsers ?? 0,
    serialCodes: dto.serialCodes ?? [],
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
      countryCode: item.countryCode ?? "",
      isActive: item.isActive,
      status: item.status ?? "Active",
      createdById: item.createdById ?? null,
      rejectionReason: item.rejectionReason ?? null,
      approvedAt: null,
      rejectedAt: null,
      maxRegisters: item.maxRegisters,
      currentRegisterCount: 0,
      subdomain: "",
      identificationNumber: "",
      identificationTypeId: 0,
      maxBranches: 0,
      maxUsers: 0,
      serialCodes: [],
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

export async function createTenant(data: CreateTenantDto): Promise<CreateTenantResponseDto> {
  const response = await api.post<CreateTenantResponseDto>("/api/Tenants", data)
  return response.data
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

export async function getSerialCodes(tenantId: string): Promise<PosSerialCodeResponseDto[]> {
  const response = await api.get<PosSerialCodeResponseDto[]>(`/api/Tenants/${tenantId}/serial-codes`)
  return response.data
}

export async function decommissionSerial(
  tenantId: string,
  serialId: string,
  reason?: string
): Promise<PosSerialCodeResponseDto> {
  const body: DecommissionSerialDto = { reason: reason || null }
  const response = await api.post<PosSerialCodeResponseDto>(
    `/api/Tenants/${tenantId}/serial-codes/${serialId}/decommission`,
    body
  )
  return response.data
}

export async function resetAdminCredentials(tenantId: string): Promise<ResetAdminCredentialsResponseDto> {
  const response = await api.post<ResetAdminCredentialsResponseDto>(`/api/Tenants/${tenantId}/reset-admin`)
  return response.data
}

export async function canCreateRegister(tenantId: string): Promise<CanCreateRegisterResponseDto> {
  const response = await api.get<CanCreateRegisterResponseDto>(`/api/Tenants/${tenantId}/can-create-register`)
  return response.data
}

export async function adjustSerialCodes(
  tenantId: string,
  data: AdjustSerialCodesDto
): Promise<SerialCodeAdjustmentResultDto> {
  const response = await api.post<SerialCodeAdjustmentResultDto>(`/api/Tenants/${tenantId}/adjust-serial-codes`, data)
  return response.data
}

export interface ApproveTenantResponseDto {
  tenantId: string
  tenantName: string
  status: string
  approvedAt: string
  adminUsername: string
  adminTemporaryPassword: string
  adminTemporaryPin: string
}

export async function approveTenant(tenantId: string): Promise<ApproveTenantResponseDto> {
  const response = await api.post<ApproveTenantResponseDto>(`/api/Tenants/${tenantId}/approve`)
  return response.data
}

export async function rejectTenant(tenantId: string, reason: string): Promise<void> {
  await api.post(`/api/Tenants/${tenantId}/reject`, { reason })
}

export async function getPendingTenants(page: number, pageSize: number): Promise<PagedTenantsResponse> {
  const response = await api.get<PagedTenantListResponse>("/api/Tenants/pending", {
    params: { pageNumber: page, pageSize },
  })
  return mapListResponseToPagedTenants(response.data)
}
