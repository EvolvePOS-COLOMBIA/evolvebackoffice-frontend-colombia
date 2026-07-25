import type { z } from "zod"

import { clientSchema } from "@/features/platform/clients/schemas/client-schema"

export interface TenantClient {
  id: string
  businessName: string
  slug: string
  adminEmail: string
  phone: string
  status: "active" | "inactive"
  createdAt: string
}

export type TenantClientFormValues = z.infer<typeof clientSchema>
