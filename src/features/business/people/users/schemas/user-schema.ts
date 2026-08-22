import { z } from "zod"
import type { TFunction } from "i18next"

export const createUserSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(1, t("name_required")),
    email: z.string().email(t("email_invalid")).nullable().optional(),
    documentType: z.coerce.number().min(1).max(2),
    documentNumber: z.string().min(1, t("document_required")),
    role: z.string().min(1, t("role_required")),
  })

export const updateUserSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(1, t("name_required")),
  })

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>
export type UpdateUserFormValues = z.infer<ReturnType<typeof updateUserSchema>>
