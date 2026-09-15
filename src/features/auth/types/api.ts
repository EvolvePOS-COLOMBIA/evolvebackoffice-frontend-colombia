/**
 * DTOs de `/api/Auth` tal como los expone el backend.
 * Fuente: Swagger de posco.ursposdemo.com.
 */

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

export interface AuthResponseDto {
  user: UserResponseDto
  token: string
  refreshToken: string | null
  refreshTokenExpiresAtUtc: string
  forcePasswordChange: boolean
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}
