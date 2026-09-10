import { z } from "zod"
import type { TFunction } from "i18next"

export const tenantSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, t("name_min")),
    contactEmail: z.string().email(t("email_validation")),
    phone: z.string(),
    address: z.string(),
    maxRegisters: z.coerce.number().int().min(1, t("max_registers_min")),
    adminIdentification: z.string().min(1, t("admin_identification_required")),
    subdomain: z.string().optional().default(""),
    identificationNumber: z.string().optional().default(""),
    identificationTypeId: z.coerce.number().int().min(0),
    maxBranches: z.coerce.number().int().min(0).optional().default(0),
    maxUsers: z.coerce.number().int().min(0).optional().default(0),
  })
