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
    .min(12, "Description must contain at least 12 characters.")
    .max(1000, "Description must contain at most 1000 characters."),
})
