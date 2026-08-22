import { z } from "zod"
import type { TFunction } from "i18next"

export const tenantSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, t("name_min")),
    contactEmail: z.string().email(t("email_validation")),
    phone: z.string(),
    address: z.string(),
    maxRegisters: z.coerce.number().int().min(1, t("max_registers_min")),
  })
