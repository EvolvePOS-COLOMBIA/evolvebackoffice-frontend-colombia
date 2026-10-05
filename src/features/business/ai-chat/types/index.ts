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
}

export interface SendChatPayload {
  conversationId?: string | null
  message: string
}
