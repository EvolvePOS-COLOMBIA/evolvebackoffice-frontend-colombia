import { api } from "@/config/axios-client"
import type { AiChatResponse, AiConversation, AiConversationDetail, SendChatPayload } from "../types"

const BASE = "/api/ai/chat"

export async function getConversations(): Promise<AiConversation[]> {
  const response = await api.get<AiConversation[]>(`${BASE}/conversations`)
  return response.data
}

export async function getConversation(id: string): Promise<AiConversationDetail> {
  const response = await api.get<AiConversationDetail>(`${BASE}/conversations/${id}`)
  return response.data
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`${BASE}/conversations/${id}`)
}

/**
 * Envía un mensaje al asistente y devuelve la respuesta final ya persistida.
 * El backend resuelve todo el loop de herramientas y entrega la respuesta
 * completa de una sola vez (sin streaming).
 */
export async function sendChatMessage(payload: SendChatPayload): Promise<AiChatResponse> {
  const response = await api.post<AiChatResponse>(BASE, payload)
  return response.data
}
