export type AppRole = "PlatformAdmin" | "BusinessAdmin"

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: AppRole
}

export interface AppSession {
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
  user: AuthUser
  managedTenantIds: string[]
}

export interface PlatformLoginFormValues {
  email: string
  password: string
}

export interface BusinessLoginFormValues {
  slug: string
  email: string
  password: string
}
