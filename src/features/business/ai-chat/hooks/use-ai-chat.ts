import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteConversation, getConversation, getConversations, sendChatMessage } from "../services/ai-chat.service"
import type { SendChatPayload } from "../types"

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

export function useSendChatMessage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendChatPayload) => sendChatMessage(payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: aiChatKeys.conversations() })
      if (variables.conversationId) {
        void qc.invalidateQueries({ queryKey: aiChatKeys.conversation(variables.conversationId) })
      }
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
