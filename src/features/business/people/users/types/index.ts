export enum DocumentType {
  CedulaCiudadania = 1,
  CedulaExtranjeria = 2,
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.CedulaCiudadania]: "CC",
  [DocumentType.CedulaExtranjeria]: "CE",
}

export type Role = "Admin" | "Manager" | "Cashier"

export interface UserResponseDto {
  id: string
  fullName: string | null
  email: string | null
  documentType: DocumentType | null
  documentNumber: string | null
  username: string | null
  role: string | null
  forcePasswordChange: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  temporaryPin: string | null
  temporaryWebPassword: string | null
}

export interface CreateUserDto {
  fullName: string | null
  email: string | null
  documentType: DocumentType
  documentNumber: string | null
  role: string | null
}

export interface UpdateUserDto {
  fullName: string | null
}
