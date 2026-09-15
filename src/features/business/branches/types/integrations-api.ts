/**
 * DTOs para integraciones de plataformas externas (WooCommerce, CLUVI).
 * Fuente: BranchIntegrationDtos.cs del backend.
 */

export interface BranchIntegrationResponseDto {
  id: string
  branchId: string
  platformCode: string
  isActive: boolean
  baseUrl: string
  settingsJson: string | null
  lastSyncedAtUtc: string | null
  lastSyncStatus: string
  lastError: string | null
}

export interface CreateBranchIntegrationDto {
  platformCode: string
  isActive: boolean
  baseUrl: string
  apiKey?: string | null
  apiSecret?: string | null
  consumerKey?: string | null
  consumerSecret?: string | null
  settingsJson?: string | null
}

export interface UpdateBranchIntegrationDto {
  isActive?: boolean | null
  baseUrl?: string | null
  setNewApiKey: boolean
  apiKey?: string | null
  setNewApiSecret: boolean
  apiSecret?: string | null
  setNewConsumerKey: boolean
  consumerKey?: string | null
  setNewConsumerSecret: boolean
  consumerSecret?: string | null
  settingsJson?: string | null
}

export interface TestConnectionResult {
  success: boolean
  message: string
}

/** Platform codes supported by the backend. */
export type PlatformCode = "WOOCOMMERCE" | "CLUVI"

/** Form values for creating/editing an integration. */
export interface IntegrationFormValues {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
  apiKey: string
  apiSecret: string
}
