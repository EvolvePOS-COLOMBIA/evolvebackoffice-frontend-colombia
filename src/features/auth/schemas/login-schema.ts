import { z } from "zod"

export const platformLoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must have at least 6 characters."),
})

export const businessLoginSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must have at least 3 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must have at least 6 characters."),
})
