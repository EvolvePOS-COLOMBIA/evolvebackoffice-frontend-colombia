import { z } from "zod"
import type { TFunction } from "i18next"

export const platformLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("email_validation")),
    password: z.string().min(6, t("password_validation")),
  })

export const businessLoginSchema = (t: TFunction) =>
  z.object({
    tenantPublicId: z.string().min(1, t("tenant_public_id_validation")),
    email: z.string().email(t("email_validation")),
    password: z.string().min(6, t("password_validation")),
  })
