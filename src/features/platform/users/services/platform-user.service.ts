import { api } from "@/config/axios-client"
import type {
  PlatformUserListResponse,
  PlatformUserResponse,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
} from "../types/api"

export async function listPlatformUsers(): Promise<PlatformUserListResponse[]> {
  const response = await api.get<PlatformUserListResponse[]>("/api/platform-users")
  return response.data
}

export async function getPlatformUser(id: string): Promise<PlatformUserResponse> {
  const response = await api.get<PlatformUserResponse>(`/api/platform-users/${id}`)
  return response.data
}

export async function createPlatformUser(data: CreatePlatformUserRequest): Promise<PlatformUserResponse> {
  const response = await api.post<PlatformUserResponse>("/api/platform-users", data)
  return response.data
}

export async function updatePlatformUser(id: string, data: UpdatePlatformUserRequest): Promise<PlatformUserResponse> {
  const response = await api.put<PlatformUserResponse>(`/api/platform-users/${id}`, data)
  return response.data
}

export async function activatePlatformUser(id: string): Promise<void> {
  await api.post(`/api/platform-users/${id}/activate`)
}

export async function deactivatePlatformUser(id: string): Promise<void> {
  await api.post(`/api/platform-users/${id}/deactivate`)
}
