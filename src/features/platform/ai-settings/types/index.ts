export interface AiSetting {
  id: string
  baseUrl: string
  model: string
  hasApiKey: boolean
  isActive: boolean
}

export interface UpdateAiSettingFormValues {
  baseUrl: string
  model: string
  /** Vacía o ausente = mantener la API key ya guardada. */
  apiKey?: string
}
