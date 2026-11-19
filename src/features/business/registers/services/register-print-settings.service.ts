import { api } from "@/config/axios-client"
import type { RegisterPrintSettingsDto, UpdateRegisterPrintSettingsDto } from "../types/print"

export async function getRegisterPrintSettings(registerId: string): Promise<RegisterPrintSettingsDto> {
  const { data } = await api.get<RegisterPrintSettingsDto>(`/api/registers/${registerId}/print-settings`)
  return data
}

export async function upsertRegisterPrintSettings(
  registerId: string,
  dto: UpdateRegisterPrintSettingsDto
): Promise<RegisterPrintSettingsDto> {
  const { data } = await api.put<RegisterPrintSettingsDto>(`/api/registers/${registerId}/print-settings`, dto)
  return data
}
