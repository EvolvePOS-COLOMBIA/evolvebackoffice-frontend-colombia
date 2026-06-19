// Enums del Servidor
export enum ReleaseType {
  Development = 1,
  Testing = 2,
  Staging = 3,
  Production = 4,
  Preview = 5,
  Beta = 6,
}

export type UserRole = "admin" | "user" | "app"
export type ChangeType = "Feature" | "BugFix" | "Improvement" | "Security" | "Deprecated" | "Removed" | "Others"

// Respuestas de la API (Models directos de C#)
export interface UserResponse {
  id: string
  userName: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAtUtc: string
}

export interface LoginResponse {
  accessToken: string | null
  expiresAtUtc: string
  user: UserResponse
}

export interface SoftwareResponse {
  id: string
  name: string
  description: string | null
  isActive: boolean
  countVersions: number
  createdAtUtc: string
  updatedAtUtc: string
  deletedAtUtc: string | null
}

export type VersionChange = {
  id: string
  type: ChangeType
  description: string
}

export interface SoftwareVersionResponse {
  id: string
  softwareProductId: string // software product id
  softwareName: string | null // software name
  versionNumber: string // version number
  releaseType: ReleaseType // real release type
  publishedAtUtc: string // published at utc time
  isMandatory: boolean // is mandatory
  isPublicDownload: boolean // is public download - updateble
  details: string | null // summary - updateble
  changes: VersionChange[] // changes - updateble
  isActive: boolean // is active - updateble
  requiredSoftwareVersionId: string | null // required software version id - updateble
  packageSize: number // package size
}

export interface DashboardSummaryResponse {
  totalSoftware: number
  totalVersions: number
  publicVersions: number
  downloadsLast30Days: number
  recentReleases: RecentReleaseItem[] | null
  topDownloadedSoftware: TopDownloadedSoftwareItem[] | null
}

export interface RecentReleaseItem {
  versionId: string
  softwareName: string | null
  versionNumber: string | null
  releaseType: ReleaseType
  publishedAtUtc: string
}

export interface TopDownloadedSoftwareItem {
  softwareId: string
  softwareName: string | null
  downloadCount: number
}

// DTOs para Peticiones (Requests)
export interface CreateSoftwareRequest {
  name: string
  description?: string | null
  isActive: boolean
}

export interface CreateUserRequest {
  userName: string
  email: string
  fullName: string
  password?: string
  role: UserRole
  isActive: boolean
}

export interface UpdateUserRequest {
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  newPassword?: string | null
}

export interface CreateSoftwareVersionRequest {
  softwareProductId: string
  versionNumber: string
  releaseType: ReleaseType
  publishedAtUtc: string
  isMandatory: boolean
  isPublicDownload: boolean
  details: string | null
  changes: VersionChange[]
  isActive: boolean
  requiredSoftwareVersionId: string | null
}

export interface UpdateSoftwareVersionRequest {
  details: string | null
  isActive: boolean
  isMandatory: boolean
  requiredSoftwareVersionId: string | null
  changes: VersionChange[]
  changesJson: string
}

// Estado local de la Aplicación en Zustand (Cliente puro)
export interface Session {
  accessToken: string
  expiresAtUtc: string
  user: UserResponse
}
