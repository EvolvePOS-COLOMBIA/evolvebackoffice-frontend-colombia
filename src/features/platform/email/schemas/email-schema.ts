import { z } from "zod"
import type { TFunction } from "i18next"

export const emailSettingsSchema = (t: TFunction) =>
  z.object({
    smtpServer: z.string().min(1, t("smtp_server") + " es requerido"),
    smtpPort: z.coerce.number().int().min(1, t("smtp_port") + " es requerido"),
    username: z.string().optional().default(""),
    password: z.string().optional().default(""),
    senderEmail: z.string().email("Email inválido"),
    senderName: z.string().min(1, t("sender_name") + " es requerido"),
    encryptionType: z.string().min(1),
  })

export const sendTestEmailSchema = (_t: TFunction) =>
  z.object({
    recipientEmail: z.string().email("Email inválido"),
  })

export type EmailSettingsFormValues = z.infer<ReturnType<typeof emailSettingsSchema>>
export type SendTestEmailFormValues = z.infer<ReturnType<typeof sendTestEmailSchema>>
