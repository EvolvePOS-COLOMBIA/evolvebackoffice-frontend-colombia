import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { notify } from "@/hooks/use-notify"
import { getApiErrorMessage } from "@/utils/api-error"
import { deleteConversation, getConversation, getConversations, sendChatMessage } from "../services/ai-chat.service"
import type { AiChatResponse, SendChatPayload } from "../types"

export const aiChatKeys = {
  all: ["ai-chat"] as const,
  conversations: () => ["ai-chat", "conversations"] as const,
  conversation: (id: string) => ["ai-chat", "conversation", id] as const,
}

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: aiChatKeys.conversations(),
    queryFn: getConversations,
    enabled,
    staleTime: 30_000,
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: aiChatKeys.conversation(id ?? ""),
    queryFn: () => getConversation(id as string),
    enabled: id !== null,
    staleTime: 15_000,
  })
}

interface SendChatVariables {
  payload: SendChatPayload
  /** Se invoca cuando la respuesta terminó y ya está persistida en el servidor. */
  onReady?: (result: AiChatResponse) => void
  /** Mensaje mostrado si la petición falla. */
  errorMessage: string
}

/**
 * Envía un mensaje al asistente y espera la respuesta completa (sin streaming).
 * Al terminar refresca el detalle de la conversación y el historial para mostrar
 * la versión ya persistida en el servidor.
 */
export function useSendChatMessage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ payload }: SendChatVariables) => sendChatMessage(payload),
    onSuccess: async (result, variables) => {
      const newConversationId =
        result.conversationId && result.conversationId !== variables.payload.conversationId
          ? result.conversationId
          : null

      if (newConversationId) {
        // El detalle de una conversación nueva se precarga antes de activarla
        // para que el panel no muestre un spinner al cambiar de conversación.
        await qc.fetchQuery({
          queryKey: aiChatKeys.conversation(newConversationId),
          queryFn: () => getConversation(newConversationId),
          staleTime: 0,
        })
      } else {
        await qc.invalidateQueries({ queryKey: aiChatKeys.conversation(result.conversationId) })
      }

      variables.onReady?.(result)
      void qc.invalidateQueries({ queryKey: aiChatKeys.conversations() })
    },
    onError: (error, variables) => {
      notify.error(getApiErrorMessage(error, variables.errorMessage))
    },
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: aiChatKeys.all })
    },
  })
}
