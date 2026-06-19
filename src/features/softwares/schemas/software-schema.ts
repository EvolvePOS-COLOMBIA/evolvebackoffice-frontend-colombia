import { z } from "zod"

export const softwareSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must contain at least 3 characters.")
    .max(150, "Name must contain at most 150 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must contain at most 1000 characters.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value?.trim().length ? value : null)),
  isActive: z.boolean(),
})
