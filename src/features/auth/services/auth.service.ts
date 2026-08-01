import type { AxiosResponse } from "axios"
import i18n from "@/i18n"

import { api } from "@/config/axios-client"
import type { AppSession, BusinessLoginFormValues, PlatformLoginFormValues } from "@/features/auth/types"
import { defaultTenantClients } from "@/features/platform/clients/data/default-clients"
import type { TenantClient } from "@/features/platform/clients/types"
import type { CreateUserRequest, UpdateUserRequest, UserResponse } from "@/types/domain"

type DemoPlatformAccount = {
  email: string
  password: string
  fullName: string
}

type DemoBusinessAccount = {
  email: string
  password: string
  fullName: string
  managedSlugs: string[]
}

const demoPlatformAccount: DemoPlatformAccount = {
  email: "platform@posmanager.app",
  password: "Platform123",
  fullName: "Platform Owner",
}

const demoBusinessAccounts: DemoBusinessAccount[] = [
  {
    email: "owner@northstar.co",
    password: "Business123",
    fullName: "Ariana Torres",
    managedSlugs: ["northstar-market", "harbor-cafe"],
  },
  {
    email: "manager@lunafoods.co",
    password: "Business123",
    fullName: "Daniel Rojas",
    managedSlugs: ["luna-foods"],
  },
]

function createSessionToken(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function createFutureIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

export async function loginPlatformAdmin(payload: PlatformLoginFormValues): Promise<AppSession> {
  const t = i18n.getFixedT(null, "auth")
  const normalizedEmail = payload.email.trim().toLowerCase()
  const password = payload.password.trim()

  if (normalizedEmail !== demoPlatformAccount.email || password !== demoPlatformAccount.password) {
    throw new Error(t("invalid_platform_credentials"))
  }

  return {
    accessToken: createSessionToken("platform-access"),
    refreshToken: createSessionToken("platform-refresh"),
    expiresAtUtc: createFutureIso(8),
    user: {
      id: "platform-admin-1",
      email: demoPlatformAccount.email,
      fullName: demoPlatformAccount.fullName,
      role: "PlatformAdmin",
    },
    managedTenantIds: [],
  }
}

export async function loginBusinessAdmin(
  payload: BusinessLoginFormValues,
  availableClients: TenantClient[] = defaultTenantClients
): Promise<AppSession> {
  const t = i18n.getFixedT(null, "auth")
  const normalizedEmail = payload.email.trim().toLowerCase()
  const normalizedSlug = payload.slug.trim().toLowerCase()
  const password = payload.password.trim()

  const account = demoBusinessAccounts.find((item) => item.email === normalizedEmail)

  if (!account || account.password !== password) {
    throw new Error(t("invalid_business_credentials"))
  }

  const managedClients = availableClients.filter((client) => account.managedSlugs.includes(client.slug))

  if (!managedClients.some((client) => client.slug === normalizedSlug)) {
    throw new Error(t("slug_not_found"))
  }

  const orderedManagedTenantIds = [
    ...managedClients.filter((client) => client.slug === normalizedSlug).map((client) => client.id),
    ...managedClients.filter((client) => client.slug !== normalizedSlug).map((client) => client.id),
  ]

  return {
    accessToken: createSessionToken("business-access"),
    refreshToken: createSessionToken("business-refresh"),
    expiresAtUtc: createFutureIso(8),
    user: {
      id: `business-admin-${account.email}`,
      email: account.email,
      fullName: account.fullName,
      role: "BusinessAdmin",
    },
    managedTenantIds: orderedManagedTenantIds,
  }
}

export async function getUsers(): Promise<UserResponse[]> {
  const response: AxiosResponse<UserResponse[]> = await api.get("/api/auth/users")
  return response.data
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const response: AxiosResponse<UserResponse> = await api.post("/api/auth/users", payload)
  return response.data
}

export async function updateUser(userId: string, payload: UpdateUserRequest): Promise<UserResponse> {
  const response: AxiosResponse<UserResponse> = await api.put(`/api/auth/users/${userId}`, payload)
  return response.data
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/auth/users/${userId}`)
}
