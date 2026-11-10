/** Especificación de gráfica declarativa devuelta por el asistente (ChartSpecDto). */
export interface ChartSeries {
  name: string
  data: number[]
}

export interface ChartSpec {
  type: "line" | "bar" | "pie"
  title?: string | null
  labels: string[]
  series: ChartSeries[]
}

export interface AiFollowUpOption {
  id: string
  label: string
  message?: string | null
}

export interface AiFollowUpPrompt {
  question: string
  options: AiFollowUpOption[]
  allowFreeText?: boolean
  freeTextPlaceholder?: string | null
}

export interface AiConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface AiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  chart: ChartSpec | null
  createdAt: string
  followUp?: AiFollowUpPrompt | null
}

export interface AiConversationDetail {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AiMessage[]
}

export interface AiChatResponse {
  conversationId: string
  conversationTitle: string
  message: string
  chart: ChartSpec | null
  followUp?: AiFollowUpPrompt | null
}

export interface SendChatPayload {
  conversationId?: string | null
  message: string
  /** Solicita al backend regenerar la última respuesta del asistente. */
  regenerate?: boolean
}
