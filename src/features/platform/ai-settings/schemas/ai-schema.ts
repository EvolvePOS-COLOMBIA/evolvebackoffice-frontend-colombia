import { z } from "zod"
import type { TFunction } from "i18next"

// Deben coincidir con las constantes del backend (AiSetting).
export const AI_DEFAULT_MAX_COMPLETION_TOKENS = 8192
export const AI_MIN_COMPLETION_TOKENS = 256
export const AI_MAX_COMPLETION_TOKENS = 32768
// Los modelos que razonan consumen sus tokens de pensamiento del mismo
// presupuesto, por lo que el backend exige un mínimo mayor.
export const AI_MIN_REASONING_COMPLETION_TOKENS = 4096

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const aiSettingsSchema = (t: TFunction) =>
  z
    .object({
      baseUrl: z
        .string()
        .min(1, `${t("base_url")} ${t("validation_required")}`)
        .refine(isHttpUrl, t("validation_url_invalid")),
      model: z.string().min(1, `${t("model")} ${t("validation_required")}`),
      apiKey: z.string().optional().default(""),
      maxCompletionTokens: z.coerce
        .number()
        .int()
        .min(AI_MIN_COMPLETION_TOKENS, t("validation_max_tokens_range"))
        .max(AI_MAX_COMPLETION_TOKENS, t("validation_max_tokens_range")),
      supportsReasoning: z.boolean().default(false),
    })
    .refine((values) => !values.supportsReasoning || values.maxCompletionTokens >= AI_MIN_REASONING_COMPLETION_TOKENS, {
      path: ["maxCompletionTokens"],
      message: t("validation_max_tokens_reasoning"),
    })

export type AiSettingsFormValues = z.infer<ReturnType<typeof aiSettingsSchema>>
