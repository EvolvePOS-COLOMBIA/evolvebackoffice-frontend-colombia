/**
 * DTOs de `/api/Users` tal como los expone el backend.
 * Fuente: Swagger de juacopizza.ursposdemo.com (`UserResponseDto`, `CreateUserDto`,
 * `UpdateUserDto`).
 *
 * Nota: el backend documenta 1=CC y 2=CE para `identificationTypeId`. Si se
 * agregan más tipos (NIT, pasaporte), ampliar el enum y sus etiquetas aquí.
 */
export enum IdentificationType {
  CedulaCiudadania = 1,
  CedulaExtranjeria = 2,
}

export const IDENTIFICATION_TYPE_LABELS: Record<IdentificationType, string> = {
  [IdentificationType.CedulaCiudadania]: "CC",
  [IdentificationType.CedulaExtranjeria]: "CE",
}

export type Role = "Admin" | "Manager" | "Cashier"

export interface UserResponseDto {
  id: string
  personPublicId: string | null
  fullName: string | null
  firstName: string | null
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  address: string | null
  phoneNumber: string | null
  emailAddress: string | null
  email: string | null
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
  firstName: string | null
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  dateBirth?: string | null
  address?: string | null
  company?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  /** Credencial de acceso web. Puede ser null para un cajero solo-POS. */
  email: string | null
  role: string | null
}

export interface UpdateUserDto {
  firstName?: string | null
  lastName?: string | null
  identificationTypeId?: number | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  email?: string | null
  role?: string | null
  isActive?: boolean | null
}

/**
 * El backend devuelve `fullName` derivado, pero puede venir vacío en registros
 * viejos. Esta es la única forma de mostrar el nombre en toda la app.
 */
export function getUserDisplayName(user: Pick<UserResponseDto, "fullName" | "firstName" | "lastName">): string {
  if (user.fullName?.trim()) {
    return user.fullName.trim()
  }

  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return composed || "—"
}
