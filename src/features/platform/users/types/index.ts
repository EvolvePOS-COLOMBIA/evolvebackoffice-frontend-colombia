import type { AppRole } from "@/features/auth/types"

/** Roles available to users who administer the platform, never a tenant. */
export const PLATFORM_USER_ROLES = [
  "PlatformAdmin",
  "PlatformSubAdmin",
  "PlatformSupervisor",
] as const satisfies readonly Exclude<AppRole, "BusinessAdmin">[]

export type PlatformUserRole = (typeof PLATFORM_USER_ROLES)[number]

/** UI/domain representation after mapping backend roles to application roles. */
export interface PlatformUser {
  id: string
  email: string
  fullName: string
  role: PlatformUserRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

/** Roles emitted by the Platform Users Swagger endpoints. */
export type BackendPlatformRole = "ADMIN" | "SUBADMIN" | "SUPERVISOR"

/** Response returned by create, get and list platform-user endpoints. */
export interface PlatformUserResponseDto {
  id: string
  email: string
  fullName: string
  role: BackendPlatformRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  temporaryPassword?: string
}

export interface CreatePlatformUserRequest {
  email: string
  fullName: string
  password: string
  role: PlatformUserRole
  phone?: string
}

export interface UpdatePlatformUserRequest {
  email?: string
  fullName?: string
  role?: PlatformUserRole
  isActive?: boolean
  phone?: string
}
