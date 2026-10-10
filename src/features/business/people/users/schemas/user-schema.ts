import { z } from "zod"
import type { TFunction } from "i18next"

export const createUserSchema = (t: TFunction) =>
  z
    .object({
      firstName: z.string().min(1, t("first_name_required")),
      lastName: z.string(),
      email: z.string().email(t("email_invalid")).nullable().optional(),
      identificationTypeId: z.coerce.number().min(1).max(2),
      identificationNumber: z.string().min(1, t("document_required")),
      phoneNumber: z.string().nullable().optional(),
      role: z.string().min(1, t("role_required")),
      deliveryBranchId: z.string().uuid().nullable().optional(),
      vehiclePlate: z.string().max(30).nullable().optional(),
      deliveryNotes: z.string().max(1000).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => data.role.toUpperCase() !== "DELIVERY" || !!data.email, {
      message: t("delivery_email_required"),
      path: ["email"],
    })

export const updateUserSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t("first_name_required")),
    lastName: z.string().min(1, t("last_name_required")),
    phoneNumber: z.string().nullable().optional(),
  })

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>
export type UpdateUserFormValues = z.infer<ReturnType<typeof updateUserSchema>>
