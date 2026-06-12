import { z } from "zod"

import { USER_ROLES } from "@/types/domain"

const baseUserSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must have at least 3 characters.")
    .max(64, "Username must be at most 64 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only use letters, numbers, dots, underscores, and hyphens."),
  email: z.email("Enter a valid email address."),
  fullName: z
    .string()
    .min(2, "Full name must have at least 2 characters.")
    .max(120, "Full name must be at most 120 characters."),
  role: z.enum(USER_ROLES),
  isActive: z.boolean(),
})

export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "Password must have at least 6 characters."),
})

export const updateUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "Password must have at least 6 characters.").optional().or(z.literal("")),
})
