import type { z } from "zod"

import { softwareSchema } from "@/features/softwares/schemas/software-schema"

export type SoftwareFormValues = z.infer<typeof softwareSchema>
