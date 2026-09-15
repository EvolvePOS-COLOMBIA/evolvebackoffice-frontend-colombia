import axios, { type AxiosResponse } from "axios"
import i18n from "@/i18n"

import { api } from "@/config/axios-client"
import type {
  AuthSession,
  AuthResponseDto,
  ChangePasswordDto,
  TenantLoginFormValues,
  PlatformLoginFormValues,
} from "@/features/auth/types"

/**
 * Cambia la contraseña web del usuario autenticado.
 * `POST /api/Auth/change-password` responde 204 sin cuerpo y revoca todos los
 * refresh tokens del usuario (motivo "password_changed").
 */
export async function changeOwnPassword(payload: ChangePasswordDto): Promise<void> {
  await api.post("/api/Auth/change-password", payload)
}

export async function loginPlatformAdmin(payload: PlatformLoginFormValues): Promise<AuthSession> {
  try {
    const response: AxiosResponse<AuthResponseDto> = await api.post("/api/Auth/login/platform", {
      email: payload.email.trim(),
      password: payload.password,
    })

    return mapAuthResponseToSession(response.data, "PlatformAdmin", null)
  } catch (error) {
    throw mapPlatformLoginError(error)
  }
}

// The adapter is the boundary between Swagger DTOs and UI-owned session state.
function mapAuthResponseToSession(
  response: AuthResponseDto,
  role: AuthSession["user"]["role"],
  tenantId: string | null
): AuthSession {
  if (!response.token || !response.user) {
    throw new Error("The login response was incomplete.")
  }

  const claims = readJwtClaims(response.token)
  const backendRoles = [response.user.role, ...getClaimValues(claims, "role", "roles")]

  if (role === "PlatformAdmin" && !backendRoles.some(isPlatformRole)) {
    throw new Error("This account is not authorized to access the platform.")
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    expiresAtUtc: getTokenExpiry(response.token) ?? response.refreshTokenExpiresAtUtc,
    user: {
      id: response.user.id,
      email: response.user.email ?? response.user.username ?? "",
      fullName:
        response.user.fullName ||
        [response.user.firstName, response.user.lastName].filter(Boolean).join(" ") ||
        response.user.email ||
        response.user.username ||
        "",
      role,
    },
    tenantId,
    forcePasswordChange: response.forcePasswordChange,
  }
}

function isPlatformRole(role: string | null | undefined) {
  if (!role) {
    return false
  }

  return ["admin", "platformadmin", "platform-admin", "superadmin", "super-admin"].includes(role.toLowerCase())
}

function readJwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1]
    if (!payload) {
      return {}
    }

    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>
  } catch {
    return {}
  }
}

function getClaimValues(claims: Record<string, unknown>, ...names: string[]) {
  return names.flatMap((name) => {
    const value = claims[name] ?? claims[`http://schemas.microsoft.com/ws/2008/06/identity/claims/${name}`]
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : typeof value === "string"
        ? [value]
        : []
  })
}

function getTokenExpiry(token: string) {
  const expiry = readJwtClaims(token).exp
  return typeof expiry === "number" ? new Date(expiry * 1000).toISOString() : null
}

function mapPlatformLoginError(error: unknown) {
  const t = i18n.getFixedT(null, "auth")

  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(t("sign_in_error"))
  }

  if (error.response?.status === 400 || error.response?.status === 401) {
    return new Error(t("invalid_platform_credentials"))
  }

  if (error.response?.status === 403) {
    return new Error("This account is not authorized to access the platform.")
  }

  return new Error(t("sign_in_error"))
}

export async function loginBusinessAdmin(payload: TenantLoginFormValues): Promise<AuthSession> {
  try {
    const response: AxiosResponse<AuthResponseDto> = await api.post(
      "/api/Auth/login/admin",
      {
        email: payload.email.trim(),
        password: payload.password,
      },
      { headers: { "X-Tenant-Id": payload.tenantPublicId.trim() } }
    )

    return mapAuthResponseToSession(response.data, "BusinessAdmin", payload.tenantPublicId.trim())
  } catch (error) {
    throw mapBusinessLoginError(error)
  }
}

function mapBusinessLoginError(error: unknown) {
  const t = i18n.getFixedT(null, "auth")

  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(t("sign_in_error"))
  }

  if (error.response?.status === 400 || error.response?.status === 401) {
    return new Error(t("invalid_business_credentials"))
  }

  if (error.response?.status === 403) {
    return new Error(t("business_access_denied"))
  }

  return new Error(t("sign_in_error"))
}
