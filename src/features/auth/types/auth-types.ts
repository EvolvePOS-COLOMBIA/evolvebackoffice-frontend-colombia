import type { z } from "zod"

import { loginSchema } from "@/features/auth/schemas/login-schema"

export type LoginFormValues = z.infer<typeof loginSchema>
