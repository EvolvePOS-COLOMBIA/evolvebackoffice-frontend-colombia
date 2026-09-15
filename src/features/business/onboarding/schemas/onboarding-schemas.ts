import { z } from "zod"
import type { TFunction } from "i18next"

/** Política del backend: 8+ caracteres, mayúscula, minúscula, dígito y símbolo. */
export const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const accountSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t("first_name_required")),
    lastName: z.string().min(1, t("last_name_required")),
    identificationTypeId: z.coerce.number().min(1),
    identificationNumber: z.string().min(1, t("document_required")),
    phoneNumber: z.string(),
    emailAddress: z.string().refine((value) => !value || EMAIL_PATTERN.test(value), {
      message: t("email_invalid"),
    }),
  })

export const businessSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("business_name_required")),
    nit: z.string(),
    contactEmail: z.string().refine((value) => !value || EMAIL_PATTERN.test(value), {
      message: t("email_invalid"),
    }),
    phone: z.string(),
    address: z.string(),
  })

export const branchSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("branch_name_required")),
    identification: z.string(),
    address: z.string().min(1, t("branch_address_required")),
    phone: z.string(),
    email: z.string().refine((value) => !value || EMAIL_PATTERN.test(value), {
      message: t("email_invalid"),
    }),
    adminUserId: z.string(),
  })

export type AccountFormValues = z.infer<ReturnType<typeof accountSchema>>
export type BusinessFormValues = z.infer<ReturnType<typeof businessSchema>>
export type BranchFormValues = z.infer<ReturnType<typeof branchSchema>>
