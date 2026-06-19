import { z } from "zod"

import type { UserRole } from "@/types/domain"

const USER_ROLES = ["admin", "user", "app"] as const satisfies readonly UserRole[]

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
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export const updateUserSchema = baseUserSchema.extend({
  password: z.string().optional(),
})
