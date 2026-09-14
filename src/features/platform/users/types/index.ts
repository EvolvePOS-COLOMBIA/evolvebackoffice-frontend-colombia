export interface PlatformUser {
  id: string
  email: string
  fullName: string
  role: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface CreatePlatformUserFormValues {
  email: string
  fullName: string
  password: string
  role: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  phone?: string
}

export interface UpdatePlatformUserFormValues {
  email?: string
  fullName?: string
  role?: "ADMIN" | "SUBADMIN" | "SUPERVISOR"
  isActive?: boolean
  phone?: string
}
