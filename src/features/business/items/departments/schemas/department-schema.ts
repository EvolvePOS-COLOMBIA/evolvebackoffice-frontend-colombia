import { z } from "zod"
import type { TFunction } from "i18next"

export const departmentSchema = (t: TFunction) =>
  z.object({
    code: z
      .string()
      .min(1, t("code_required"))
      .max(20, t("code_max", { max: 20 }))
      .regex(/^[A-Za-z0-9\-]+$/, t("code_invalid")),
    name: z
      .string()
      .min(1, t("name_required"))
      .max(100, t("name_max", { max: 100 })),
    // "" = sin departamento padre
    parentPublicId: z.string().optional().default(""),
  })

export type DepartmentFormValues = z.infer<ReturnType<typeof departmentSchema>>
