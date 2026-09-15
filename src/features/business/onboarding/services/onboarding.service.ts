import { api } from "@/config/axios-client"
import { createBranch } from "@/features/business/branches/services/branches.service"
import type { Branch, CreateBranchDto } from "@/features/business/branches/types"
import { updateUser } from "@/features/business/people/users/services/users.service"
import type { UpdateUserDto } from "@/features/business/people/users/types"

import type {
  AccountStepValues,
  BranchStepValues,
  BusinessStepValues,
  TenantSettings,
  UpdateTenantSettingsPayload,
} from "../types"

/**
 * Fachada de datos del onboarding.
 *
 * Cada función pega al backend real.
 */

/* ------------------------------------------------------------------ *
 * Paso 1 — Tu cuenta.  Disponible en el backend hoy.
 * ------------------------------------------------------------------ */

export async function saveAdminProfile(userId: string, values: AccountStepValues) {
  const payload: UpdateUserDto = {
    firstName: values.firstName,
    lastName: values.lastName,
    identificationTypeId: values.identificationTypeId,
    identificationNumber: values.identificationNumber,
    phoneNumber: values.phoneNumber || null,
    emailAddress: values.emailAddress || null,
    role: null,
  }

  return updateUser(userId, payload)
}

/* ------------------------------------------------------------------ *
 * Paso 2 — Datos del negocio.  Endpoint: /api/tenant-settings
 * ------------------------------------------------------------------ */

export async function getTenantSettings(): Promise<TenantSettings> {
  const { data } = await api.get<TenantSettings>("/api/tenant-settings")
  return data
}

export async function saveBusinessProfile(values: BusinessStepValues): Promise<TenantSettings> {
  const { data } = await api.put<TenantSettings>("/api/tenant-settings", {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone,
    address: values.address,
    identificationNumber: values.nit,
    identificationTypeId: 1,
    maxBranches: 1,
    maxUsers: 5,
  } as UpdateTenantSettingsPayload)

  return data
}

/* ------------------------------------------------------------------ *
 * Paso 3 — Primera sucursal.  Disponible en el backend hoy.
 * ------------------------------------------------------------------ */

export async function createFirstBranch(values: BranchStepValues, adminUserId: string): Promise<Branch> {
  const payload: CreateBranchDto = {
    name: values.name,
    adminUserId: values.adminUserId || adminUserId,
    identification: values.identification || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
  }

  return createBranch(payload)
}
