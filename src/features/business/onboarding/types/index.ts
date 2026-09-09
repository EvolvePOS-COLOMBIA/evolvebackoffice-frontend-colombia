export const ONBOARDING_STEPS = ["welcome", "account", "business", "branch", "modules", "done"] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]

/** Los pasos numerados que ve el usuario en el stepper. */
export const NUMBERED_STEPS: OnboardingStepId[] = ["account", "business", "branch"]

export type BusinessTypeKey =
  | "restaurante"
  | "rapidas"
  | "tienda"
  | "panaderia"
  | "bar"
  | "farmacia"
  | "servicios"
  | "otro"

/** Módulos que el usuario puede encender o apagar por sucursal. */
export type ModuleKey = "inventario" | "clientes" | "proveedores" | "reportes"

export type ModuleSelection = Record<ModuleKey, boolean>

export interface AccountStepValues {
  firstName: string
  lastName: string
  identificationTypeId: number
  identificationNumber: string
  phoneNumber: string
  emailAddress: string
}

export interface BusinessStepValues {
  name: string
  nit: string
  contactEmail: string
  phone: string
  address: string
}

/** Tenant settings response from GET /api/tenant-settings */
export interface TenantSettings {
  id: string
  name: string
  tenantId: string
  contactEmail: string
  phone: string
  address: string
  identificationNumber: string
  identificationTypeId: number
  subdomain: string
  isActive: boolean
  maxRegisters: number
  maxBranches: number
  maxUsers: number
  currentRegisterCount: number
  totalSerialCodes: number
  assignedSerialCodes: number
  createdAt: string
}

/** Payload for PUT /api/tenant-settings */
export interface UpdateTenantSettingsPayload {
  name: string
  contactEmail: string
  phone: string
  address: string
  identificationNumber: string
  identificationTypeId: number
  maxBranches: number
  maxUsers: number
}

export interface BranchStepValues {
  name: string
  identification: string
  address: string
  phone: string
  email: string
  adminUserId: string
}

/**
 * Borrador persistido del wizard, por tenant.
 */
export interface OnboardingDraft {
  stepIndex: number
  account: AccountStepValues | null
  business: BusinessStepValues | null
  branch: BranchStepValues | null
  modules: ModuleSelection
  /** Se llena cuando `POST /api/Branches` responde, para no crearla dos veces. */
  createdBranchId: string | null
  accountSaved: boolean
  passwordChanged: boolean
}

export type OnboardingReason =
  | "dev_override"
  | "force_password_change"
  | "no_branches"
  | "backend_flag"
  | "completed"
  | "unknown"

export interface OnboardingStatus {
  isLoading: boolean
  /** true = hay que mandar al usuario al onboarding. */
  isPending: boolean
  reason: OnboardingReason
}
