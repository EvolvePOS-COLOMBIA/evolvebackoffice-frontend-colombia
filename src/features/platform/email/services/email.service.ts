import { api } from "@/config/axios-client"
import type { EmailSetting, UpdateEmailSettingFormValues, SendTestEmailFormValues } from "../types"

export async function getEmailSetting(): Promise<EmailSetting | null> {
  try {
    const response = await api.get<EmailSetting>("/api/email-settings")
    return response.data
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } }).response?.status === 204) {
      return null
    }
    throw error
  }
}

export async function updateEmailSetting(data: UpdateEmailSettingFormValues): Promise<EmailSetting> {
  const response = await api.put<EmailSetting>("/api/email-settings", data)
  return response.data
}

export async function sendTestEmail(data: SendTestEmailFormValues): Promise<void> {
  await api.post("/api/email-settings/test", data)
}
