import { z } from "zod"
import type { TFunction } from "i18next"

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const aiSettingsSchema = (t: TFunction) =>
  z.object({
    baseUrl: z
      .string()
      .min(1, `${t("base_url")} ${t("validation_required")}`)
      .refine(isHttpUrl, t("validation_url_invalid")),
    model: z.string().min(1, `${t("model")} ${t("validation_required")}`),
    apiKey: z.string().optional().default(""),
  })

export type AiSettingsFormValues = z.infer<ReturnType<typeof aiSettingsSchema>>
