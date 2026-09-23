import { z } from "zod"
import type { TFunction } from "i18next"

export const createCustomerSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t("first_name_required")),
    lastName: z.string().min(1, t("last_name_required")),
    identificationTypeId: z.coerce.number().min(1).max(2),
    identificationNumber: z.string().min(1, t("document_required")),
    phoneNumber: z.string().nullable().optional(),
    emailAddress: z.string().email(t("email_invalid")).nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
  })

export const updateCustomerSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t("first_name_required")).optional(),
    lastName: z.string().min(1, t("last_name_required")).optional(),
    identificationTypeId: z.coerce.number().min(1).max(2).optional(),
    identificationNumber: z.string().min(1, t("document_required")).optional(),
    phoneNumber: z.string().nullable().optional(),
    emailAddress: z.string().email(t("email_invalid")).nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
  })

export type CreateCustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>
export type UpdateCustomerFormValues = z.infer<ReturnType<typeof updateCustomerSchema>>
