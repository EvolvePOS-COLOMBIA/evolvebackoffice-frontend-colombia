import { z } from "zod"

export const clientSchema = z.object({
  businessName: z.string().min(2, "Business name must have at least 2 characters."),
  slug: z
    .string()
    .min(3, "Slug must have at least 3 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  adminEmail: z.string().email("Enter a valid email address."),
  phone: z.string().min(7, "Phone must have at least 7 characters."),
  status: z.enum(["active", "inactive"]),
})
