export const RELEASE_CHANNELS = [
  "Development",
  "Testing",
  "Production",
] as const

export const CHANGE_CATEGORIES = [
  "Feature",
  "Bug Fix",
  "Improvement",
  "Security",
  "Deprecated",
  "Removed",
  "Others",
] as const

export const USER_ROLES = ["admin", "user"] as const

export type ReleaseChannel = (typeof RELEASE_CHANNELS)[number]
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number]
export type UserRole = (typeof USER_ROLES)[number]

export type Session = {
  token: string
  expiresAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export type UserAccount = {
  id: string
  userName: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAtUtc: string
}

export type AuthSessionResponse = {
  accessToken: string
  expiresAtUtc: string
  user: UserAccount
}

export type SoftwareProduct = {
  id: string
  name: string
  description: string
  code: string
  createdAt: string
}

export type VersionChange = {
  id: string
  versionId: string
  category: ChangeCategory
  description: string
}

export type ReleaseVersion = {
  id: string
  softwareId: string
  versionNumber: string
  summary: string
  releaseChannel: ReleaseChannel
  isCritical: boolean
  releaseDate: string
  zipFilePath: string
  zipFileName: string
  zipFileSize: number
  createdAt: string
  changes: VersionChange[]
}

export type CreateSoftwareInput = Pick<SoftwareProduct, "name" | "description">

export type CreateVersionInput = {
  softwareId: string
  versionNumber: string
  summary: string
  releaseChannel: ReleaseChannel
  isCritical: boolean
  releaseDate: string
  zipFileName: string
  zipFileSize: number
  changes: Array<{
    category: ChangeCategory
    description: string
  }>
}

export const RELEASE_CHANNEL_LABELS: Record<ReleaseChannel, string> = {
  Development: "Development",
  Testing: "Testing",
  Production: "Production",
}

export const CHANGE_CATEGORY_LABELS: Record<ChangeCategory, string> = {
  Feature: "Feature",
  "Bug Fix": "Bug Fix",
  Improvement: "Improvement",
  Security: "Security",
  Deprecated: "Deprecated",
  Removed: "Removed",
  Others: "Others",
}
