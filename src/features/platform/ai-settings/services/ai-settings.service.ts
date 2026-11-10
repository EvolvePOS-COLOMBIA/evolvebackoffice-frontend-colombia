import { api } from "@/config/axios-client"
import type { AiSetting, UpdateAiSettingFormValues } from "../types"

export async function getAiSetting(): Promise<AiSetting | null> {
  try {
    const response = await api.get<AiSetting>("/api/ai-settings")
    return response.data || null
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } }).response?.status === 204) {
      return null
    }
    throw error
  }
}

export async function updateAiSetting(data: UpdateAiSettingFormValues): Promise<AiSetting> {
  const response = await api.put<AiSetting>("/api/ai-settings", data)
  return response.data
}

export async function testAiSetting(): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>("/api/ai-settings/test")
  return response.data
}
