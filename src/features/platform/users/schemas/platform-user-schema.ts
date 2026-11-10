import { z } from "zod"
import type { TFunction } from "i18next"
import { PLATFORM_USER_ROLES } from "../types"

export const platformUserRoleSchema = z.enum(PLATFORM_USER_ROLES)

// Los campos que el modal edita son requeridos en ambos modos. La contraseña
// solo se solicita al crear un usuario.
export const platformUserSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t("email_required")).email(t("email_invalid")),
    fullName: z.string().min(1, t("full_name_required")),
    // The password input is unmounted while editing, but RHF retains its empty
    // default value. Accept that value here; creation handles it explicitly.
    password: z.union([z.string().min(8, t("password_min_length")), z.literal("")]).optional(),
    role: platformUserRoleSchema,
  })

export type PlatformUserFormValues = z.infer<ReturnType<typeof platformUserSchema>>

// Schema estricto para validación en creación (password es requerido)
export const createPlatformUserSchema = (t: TFunction) =>
  platformUserSchema(t).extend({
    password: z.string().min(8, t("password_min_length")),
  })

export type CreatePlatformUserSchemaValues = z.infer<ReturnType<typeof createPlatformUserSchema>>
