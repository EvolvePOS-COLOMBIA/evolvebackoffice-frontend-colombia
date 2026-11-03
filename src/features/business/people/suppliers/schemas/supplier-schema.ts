import { z } from "zod"
import type { TFunction } from "i18next"

export const createSupplierSchema = (t: TFunction) =>
  z.object({
    company: z.string().min(1, t("company_required")),
    firstName: z.string().min(1, t("first_name_required")),
    identificationTypeId: z.coerce.number().min(1).max(2),
    identificationNumber: z.string().min(1, t("document_required")),
    lastName: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    emailAddress: z.string().email(t("email_invalid")).nullable().optional(),
    url: z.string().url(t("url_invalid")).nullable().optional().or(z.literal("")),
    accountNumber: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
  })

export type CreateSupplierFormValues = z.infer<ReturnType<typeof createSupplierSchema>>
