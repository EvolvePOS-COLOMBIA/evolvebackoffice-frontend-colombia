import { z } from "zod"
import type { TFunction } from "i18next"

export const platformLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().email(t("email_validation")),
    password: z.string().min(6, t("password_validation")),
  })

export const businessLoginSchema = (t: TFunction) =>
  z.object({
    slug: z
      .string()
      .min(3, t("slug_min_validation"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug_regex_validation")),
    email: z.string().email(t("email_validation")),
    password: z.string().min(6, t("password_validation")),
  })
