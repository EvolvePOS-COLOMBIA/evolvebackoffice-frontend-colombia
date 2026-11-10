import { api } from "@/config/axios-client"
import type {
  ActivateStoreResponse,
  BranchIntegrationResponseDto,
  CreateBranchIntegrationDto,
  SyncMenuResponse,
  TestConnectionResult,
  UpdateBranchIntegrationDto,
} from "../types/integrations-api"

const BASE = "/api/branches"

/* ─── List ─── */

export async function listBranchIntegrations(branchId: string): Promise<BranchIntegrationResponseDto[]> {
  const { data } = await api.get<BranchIntegrationResponseDto[]>(`${BASE}/${branchId}/integrations`)
  return Array.isArray(data) ? data : []
}

/* ─── Get by ID ─── */

export async function getBranchIntegration(branchId: string, id: string): Promise<BranchIntegrationResponseDto> {
  const { data } = await api.get<BranchIntegrationResponseDto>(`${BASE}/${branchId}/integrations/${id}`)
  return data
}

/* ─── Create ─── */

export async function createBranchIntegration(
  branchId: string,
  dto: CreateBranchIntegrationDto
): Promise<BranchIntegrationResponseDto> {
  const { data } = await api.post<BranchIntegrationResponseDto>(`${BASE}/${branchId}/integrations`, dto)
  return data
}

/* ─── Update ─── */

export async function updateBranchIntegration(
  branchId: string,
  id: string,
  dto: UpdateBranchIntegrationDto
): Promise<void> {
  await api.put(`${BASE}/${branchId}/integrations/${id}`, dto)
}

/* ─── Delete (soft) ─── */

export async function deleteBranchIntegration(branchId: string, id: string): Promise<void> {
  await api.delete(`${BASE}/${branchId}/integrations/${id}`)
}

/* ─── Test connection ─── */

export async function testBranchIntegrationConnection(branchId: string, id: string): Promise<TestConnectionResult> {
  const { data } = await api.post<TestConnectionResult>(`${BASE}/${branchId}/integrations/${id}/test-connection`)
  return data
}

/* ─── Activate store (Cluvi) ─── */

/**
 * Activa la tienda en Cluvi para aceptar pedidos. El backend configura los
 * webhooks (new_order → webhook del backend, ping → /health) que Cluvi
 * exige al activar y devuelve las URLs registradas.
 */
export async function activateBranchIntegrationStore(branchId: string, id: string): Promise<ActivateStoreResponse> {
  const { data } = await api.post<ActivateStoreResponse>(`${BASE}/${branchId}/integrations/${id}/activate-store`)
  return data
}

/* ─── Sync menu (Cluvi) ─── */

/**
 * Sincroniza el menú de la sucursal hacia Cluvi. El backend construye el menú
 * desde los artículos con IsPublishedForWeb y sus modificadores — no se
 * envían productos en la petición.
 */
export async function syncBranchIntegrationMenu(branchId: string, id: string): Promise<SyncMenuResponse> {
  const { data } = await api.put<SyncMenuResponse>(`${BASE}/${branchId}/integrations/${id}/sync-menu`)
  return data
}
