import { api } from "@/config/axios-client"
import type { UpdateWhatsAppSettingsPayload, WhatsAppQr, WhatsAppStatus } from "../types"

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await api.get<WhatsAppStatus>("/api/whatsapp")
  return response.data
}

export async function connectWhatsApp(phoneNumber: string): Promise<WhatsAppQr> {
  const response = await api.post<WhatsAppQr>("/api/whatsapp/connect", { phoneNumber })
  return response.data
}

export async function getWhatsAppQr(): Promise<WhatsAppQr> {
  const response = await api.get<WhatsAppQr>("/api/whatsapp/qr")
  return response.data
}

export async function updateWhatsAppSettings(payload: UpdateWhatsAppSettingsPayload): Promise<WhatsAppStatus> {
  const response = await api.put<WhatsAppStatus>("/api/whatsapp/settings", payload)
  return response.data
}

export async function sendWhatsAppTest(phoneNumber: string): Promise<void> {
  await api.post("/api/whatsapp/test", { phoneNumber })
}

export async function disconnectWhatsApp(): Promise<WhatsAppStatus> {
  const response = await api.post<WhatsAppStatus>("/api/whatsapp/disconnect")
  return response.data
}
