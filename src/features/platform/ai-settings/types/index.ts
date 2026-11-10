export interface AiSetting {
  id: string
  baseUrl: string
  model: string
  maxCompletionTokens: number
  supportsReasoning: boolean
  hasApiKey: boolean
  isActive: boolean
}

export interface UpdateAiSettingFormValues {
  baseUrl: string
  model: string
  /** Vacía o ausente = mantener la API key ya guardada. */
  apiKey?: string
  /** Presupuesto de tokens de salida por llamada (max_tokens). */
  maxCompletionTokens: number
  /** El modelo expone razonamiento (reasoning_content) y consume tokens de pensamiento. */
  supportsReasoning: boolean
}
