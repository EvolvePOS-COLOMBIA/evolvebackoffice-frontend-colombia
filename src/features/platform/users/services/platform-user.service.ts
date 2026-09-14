import { api } from "@/config/axios-client"
import type { AppRole } from "@/features/auth/types"
import type {
  PlatformUser,
  PlatformUserListResponse,
  PlatformUserResponse,
  BackendPlatformRole,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
} from "../types/api"

const BACKEND_ROLE_BY_APP_ROLE: Record<Exclude<AppRole, "BusinessAdmin">, BackendPlatformRole> = {
  PlatformAdmin: "ADMIN",
  PlatformSubAdmin: "SUBADMIN",
  PlatformSupervisor: "SUPERVISOR",
}

const APP_ROLE_BY_BACKEND_ROLE: Record<BackendPlatformRole, AppRole> = {
  ADMIN: "PlatformAdmin",
  SUBADMIN: "PlatformSubAdmin",
  SUPERVISOR: "PlatformSupervisor",
}

export function toBackendRole(role: AppRole): BackendPlatformRole {
  const mapped = BACKEND_ROLE_BY_APP_ROLE[role as Exclude<AppRole, "BusinessAdmin">]
  return mapped ?? (role.toUpperCase() as BackendPlatformRole)
}

export function toAppRole(role: string | null | undefined): AppRole {
  const normalized = (role ?? "").trim().toUpperCase()
  return APP_ROLE_BY_BACKEND_ROLE[normalized as BackendPlatformRole] ?? (normalized as AppRole)
}

function mapPlatformUser(raw: PlatformUserListResponse | PlatformUserResponse): PlatformUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: toAppRole(raw.role),
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    lastLoginAt: raw.lastLoginAt,
  }
}

export async function listPlatformUsers(): Promise<PlatformUser[]> {
  const response = await api.get<PlatformUserListResponse[]>("/api/platform-users")
  return response.data.map(mapPlatformUser)
}

export async function getPlatformUser(id: string): Promise<PlatformUser> {
  const response = await api.get<PlatformUserResponse>(`/api/platform-users/${id}`)
  return mapPlatformUser(response.data)
}

export async function createPlatformUser(data: CreatePlatformUserRequest): Promise<PlatformUserResponse> {
  const response = await api.post<PlatformUserResponse>("/api/platform-users", {
    ...data,
    role: toBackendRole(data.role),
  })
  return response.data
}

export async function updatePlatformUser(id: string, data: UpdatePlatformUserRequest): Promise<PlatformUserResponse> {
  const response = await api.put<PlatformUserResponse>(`/api/platform-users/${id}`, {
    ...data,
    role: data.role ? toBackendRole(data.role) : undefined,
  })
  return response.data
}

export async function activatePlatformUser(id: string): Promise<void> {
  await api.post(`/api/platform-users/${id}/activate`)
}

export async function deactivatePlatformUser(id: string): Promise<void> {
  await api.post(`/api/platform-users/${id}/deactivate`)
}
