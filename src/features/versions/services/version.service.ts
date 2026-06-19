import type { AxiosResponse } from "axios"

import { api } from "@/config/axios-client"
import type { CreateSoftwareVersionRequest, SoftwareVersionResponse, UpdateSoftwareVersionRequest } from "@/types/domain"

export type CreateVersionRequest = CreateSoftwareVersionRequest
export type UpdateVersionRequest = UpdateSoftwareVersionRequest

export async function getVersionsBySoftware(softwareId: string): Promise<SoftwareVersionResponse[]> {
  const response: AxiosResponse<SoftwareVersionResponse[]> = await api.get(`/api/software/${softwareId}/versions`)
  return response.data
}

export async function getAllVersions(): Promise<SoftwareVersionResponse[]> {
  const response: AxiosResponse<SoftwareVersionResponse[]> = await api.get("/api/software/versions")
  return response.data
}

export async function createVersion(
  softwareId: string,
  payload: CreateVersionRequest,
  zipFile: File
): Promise<SoftwareVersionResponse> {
  const formData = new FormData()
  formData.append("softwareProductId", payload.softwareProductId)
  formData.append("versionNumber", payload.versionNumber)
  formData.append("details", payload.details ?? "")
  formData.append("releaseType", String(payload.releaseType))
  formData.append("isPublicDownload", String(payload.isPublicDownload))
  formData.append("isMandatory", String(payload.isMandatory))
  formData.append("isActive", String(payload.isActive))
  formData.append("requiredSoftwareVersionId", payload.requiredSoftwareVersionId ?? "")
  formData.append("publishedAtUtc", payload.publishedAtUtc)

  payload.changes.forEach((change, index) => {
    formData.append(`changes[${index}].id`, change.id)
    formData.append(`changes[${index}].type`, change.type)
    formData.append(`changes[${index}].description`, change.description)
  })

  formData.append("packageFile", zipFile)

  const response: AxiosResponse<SoftwareVersionResponse> = await api.post(
    `/api/software/${softwareId}/versions`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function updateVersion(
  versionId: string,
  payload: UpdateVersionRequest
): Promise<SoftwareVersionResponse> {
  const response: AxiosResponse<SoftwareVersionResponse> = await api.put(`/api/software/versions/${versionId}`, payload)
  return response.data
}

export async function deleteVersion(versionId: string): Promise<void> {
  await api.delete(`/api/software/versions/${versionId}`)
}

export async function downloadVersion(versionId: string): Promise<Blob> {
  const response: AxiosResponse<Blob> = await api.get(`/api/software/versions/${versionId}/download`, {
    responseType: "blob",
  })
  return response.data
}
