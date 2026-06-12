import type { z } from "zod"

import { createUserSchema, updateUserSchema } from "@/features/users/schemas/user-schema"

export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
export type UserFormValues = CreateUserFormValues | UpdateUserFormValues
