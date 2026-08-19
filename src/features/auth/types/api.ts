export interface UserResponseDto {
  id: string
  fullName: string
  email: string | null
  documentType: number | null
  documentNumber: string | null
  username: string
  role: string
  forcePasswordChange: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AuthResponseDto {
  user: UserResponseDto
  token: string
  refreshToken: string | null
  refreshTokenExpiresAtUtc: string
  forcePasswordChange: boolean
}
