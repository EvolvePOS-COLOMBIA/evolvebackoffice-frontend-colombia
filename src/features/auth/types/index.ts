export type AppRole = "PlatformAdmin" | "BusinessAdmin"

export type { AuthResponseDto, UserResponseDto } from "./api"

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: AppRole
}

export interface AuthSession {
  accessToken: string
  refreshToken: string | null
  expiresAtUtc: string
  user: SessionUser
  tenantId: string | null
  forcePasswordChange: boolean
}

export interface PlatformLoginFormValues {
  email: string
  password: string
}

export interface TenantLoginFormValues {
  tenantPublicId: string
  email: string
  password: string
}
