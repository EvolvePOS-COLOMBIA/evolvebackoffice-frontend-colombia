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
  /** Estado de la tienda en Cluvi: "on" | "off" (null cuando no aplica). */
  storeStatus?: "on" | "off" | null
}

/** Respuesta de PUT .../integrations/{id}/sync-menu */
export interface SyncMenuResponse {
  success: boolean
  message: string | null
  products: number
  categories: number
  modifiers: number
}

/** Respuesta de POST .../integrations/{id}/activate-store */
export interface ActivateStoreResponse {
  success: boolean
  message: string | null
  storeStatus: string | null
  newOrderWebhookUrl: string | null
  pingWebhookUrl: string | null
}

/** Platform codes supported by the backend. */
export type PlatformCode = "WOOCOMMERCE" | "CLUVI"

/** URL por defecto de la API de Cluvi (única constante compartida en el app). */
export const CLUVI_DEFAULT_BASE_URL = "https://api.cluviplatform.click"

/** Lee el storeId guardado en SettingsJson de una integración ("" si no hay). */
export function readCluviStoreId(settingsJson: string | null | undefined): string {
  if (!settingsJson) return ""
  try {
    const parsed = JSON.parse(settingsJson) as { storeId?: unknown }
    return typeof parsed.storeId === "string" ? parsed.storeId : ""
  } catch {
    return ""
  }
}
