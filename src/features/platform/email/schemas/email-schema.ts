import { z } from "zod"
import type { TFunction } from "i18next"

export const emailSettingsSchema = (t: TFunction) =>
  z.object({
    smtpServer: z.string().min(1, `${t("smtp_server")} ${t("validation_required")}`),
    smtpPort: z.coerce
      .number()
      .int()
      .min(1, `${t("smtp_port")} ${t("validation_required")}`),
    username: z.string().optional().default(""),
    password: z.string().optional().default(""),
    senderEmail: z.string().email(t("validation_email_invalid")),
    senderName: z.string().min(1, `${t("sender_name")} ${t("validation_required")}`),
    encryptionType: z.string().min(1),
  })

export const sendTestEmailSchema = (t: TFunction) =>
  z.object({
    recipientEmail: z.string().email(t("validation_email_invalid")),
  })

export type EmailSettingsFormValues = z.infer<ReturnType<typeof emailSettingsSchema>>
export type SendTestEmailFormValues = z.infer<ReturnType<typeof sendTestEmailSchema>>
