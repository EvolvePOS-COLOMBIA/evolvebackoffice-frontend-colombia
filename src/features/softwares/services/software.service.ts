import type { AxiosResponse } from "axios"

import { api } from "@/config/axios-client"
import type { CreateSoftwareRequest, SoftwareResponse } from "@/types/domain"

export async function getSoftwares(): Promise<SoftwareResponse[]> {
  const response: AxiosResponse<SoftwareResponse[]> = await api.get("/api/software")
  return response.data
}

export async function createSoftware(payload: CreateSoftwareRequest): Promise<SoftwareResponse> {
  const response: AxiosResponse<SoftwareResponse> = await api.post("/api/software", payload)
  return response.data
}

export async function updateSoftware(softwareId: string, payload: CreateSoftwareRequest): Promise<SoftwareResponse> {
  const response: AxiosResponse<SoftwareResponse> = await api.put(`/api/software/${softwareId}`, payload)
  return response.data
}

export async function deleteSoftware(softwareId: string): Promise<void> {
  await api.delete(`/api/software/${softwareId}`)
}
