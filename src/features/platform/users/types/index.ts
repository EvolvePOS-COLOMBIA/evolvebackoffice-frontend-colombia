import type { AppRole } from "@/features/auth/types"

export type { AppRole }

export interface PlatformUser {
  id: string
  email: string
  fullName: string
  role: AppRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface CreatePlatformUserFormValues {
  email: string
  fullName: string
  password: string
  role: AppRole
  phone?: string
}

export interface UpdatePlatformUserFormValues {
  email?: string
  fullName?: string
  role?: AppRole
  isActive?: boolean
  phone?: string
}
