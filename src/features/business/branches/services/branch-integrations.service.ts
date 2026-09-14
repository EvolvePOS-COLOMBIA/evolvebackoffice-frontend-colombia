import { api } from "@/config/axios-client"
import type {
  BranchIntegrationResponseDto,
  CreateBranchIntegrationDto,
  TestConnectionResult,
  UpdateBranchIntegrationDto,
} from "../types/integrations-api"

const BASE = "/api/branches"

/* ─── List ─── */

export async function listBranchIntegrations(
  branchId: string
): Promise<BranchIntegrationResponseDto[]> {
  const { data } = await api.get<BranchIntegrationResponseDto[]>(
    `${BASE}/${branchId}/integrations`
  )
  return Array.isArray(data) ? data : []
}

/* ─── Get by ID ─── */

export async function getBranchIntegration(
  branchId: string,
  id: string
): Promise<BranchIntegrationResponseDto> {
  const { data } = await api.get<BranchIntegrationResponseDto>(
    `${BASE}/${branchId}/integrations/${id}`
  )
  return data
}

/* ─── Create ─── */

export async function createBranchIntegration(
  branchId: string,
  dto: CreateBranchIntegrationDto
): Promise<BranchIntegrationResponseDto> {
  const { data } = await api.post<BranchIntegrationResponseDto>(
    `${BASE}/${branchId}/integrations`,
    dto
  )
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

export async function deleteBranchIntegration(
  branchId: string,
  id: string
): Promise<void> {
  await api.delete(`${BASE}/${branchId}/integrations/${id}`)
}

/* ─── Test connection ─── */

export async function testBranchIntegrationConnection(
  branchId: string,
  id: string
): Promise<TestConnectionResult> {
  const { data } = await api.post<TestConnectionResult>(
    `${BASE}/${branchId}/integrations/${id}/test-connection`
  )
  return data
}
