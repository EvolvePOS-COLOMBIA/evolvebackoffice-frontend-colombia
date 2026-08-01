import { z } from "zod"
import type { TFunction } from "i18next"

export const clientSchema = (t: TFunction) =>
  z.object({
    businessName: z.string().min(2, t("business_name_min")),
    slug: z
      .string()
      .min(3, t("slug_min"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug_regex")),
    adminEmail: z.string().email(t("email_validation")),
    phone: z.string().min(7, t("phone_min")),
    status: z.enum(["active", "inactive"]),
  })
