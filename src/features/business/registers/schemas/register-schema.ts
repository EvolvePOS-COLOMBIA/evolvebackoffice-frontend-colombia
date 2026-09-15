import { z } from "zod"
import type { TFunction } from "i18next"

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const registerCreateSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t("name_required"))
      .max(100, t("name_max_length", { max: 100 })),
    code: z
      .string()
      .min(1, t("code_required"))
      .max(50, t("code_max_length", { max: 50 })),
    branchPublicId: z.string().min(1, t("branch_required")).regex(uuidRegex, t("branch_invalid_uuid")),
    deviceIdentifier: z.string().optional().default(""),
    serialCode: z.string().optional().default(""),
  })

export const registerEditSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t("name_required"))
      .max(100, t("name_max_length", { max: 100 })),
    code: z.string().optional().default(""),
    branchPublicId: z.string().min(1, t("branch_required")).regex(uuidRegex, t("branch_invalid_uuid")),
    deviceIdentifier: z.string().optional().default(""),
    serialCode: z.string().optional().default(""),
  })
