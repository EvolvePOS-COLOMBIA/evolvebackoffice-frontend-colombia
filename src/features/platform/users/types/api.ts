import type { PlatformUser } from "./index"

export type { PlatformUser }

export interface PlatformUserListResponse {
  id: string
  email: string
  fullName: string
  role: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface CreatePlatformUserRequest {
  email: string
  fullName: string
  password: string
  role: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  phone?: string
}

export interface UpdatePlatformUserRequest {
  email?: string
  fullName?: string
  role?: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  isActive?: boolean
  phone?: string
}

export interface PlatformUserResponse {
  id: string
  email: string
  fullName: string
  role: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  temporaryPassword?: string
}
