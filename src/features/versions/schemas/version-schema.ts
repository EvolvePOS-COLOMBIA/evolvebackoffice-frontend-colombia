import { z } from "zod"

import { ReleaseType } from "@/types/domain"
import { isValidSemVer } from "@/utils/version-utils"

export const CHANGE_TYPES = ["Feature", "BugFix", "Improvement", "Security", "Deprecated", "Removed", "Others"] as const

export const versionChangeSchema = z.object({
  id: z.string().min(1, "Change id is required."),
  type: z.enum(CHANGE_TYPES),
  description: z.string().trim().min(8, "Must contain at least 8 characters."),
})

export const versionSchema = z.object({
  softwareProductId: z.string().min(1, "Select a software product."),
  softwareName: z.string().min(1, "Enter a software name."),
  versionNumber: z.string().trim().refine(isValidSemVer, "Version number must follow the X.Y.Z.W format."),
  details: z
    .string()
    .trim()
    .max(5000, "Details must contain at most 5000 characters.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value?.trim().length ? value : null)),
  releaseType: z.nativeEnum(ReleaseType),
  isPublicDownload: z.boolean(),
  isMandatory: z.boolean(),
  isActive: z.boolean(),
  requiredSoftwareVersionId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  publishedAtUtc: z.string().min(1, "Publish date is required."),
  zipFileName: z.string().min(1, "Attach a .zip package."),
  zipFileSize: z.number().positive("Attached file is invalid."),
  changes: z.array(versionChangeSchema).min(1, "Add at least one change."),
})

export const updateVersionSchema = z.object({
  details: z
    .string()
    .trim()
    .max(5000, "Details must contain at most 5000 characters.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value?.trim().length ? value : null)),
  isMandatory: z.boolean(),
  isActive: z.boolean(),
  requiredSoftwareVersionId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  changes: z.array(versionChangeSchema).min(1, "Add at least one change."),
})

export function createDefaultVersionChange() {
  return {
    id: crypto.randomUUID(),
    type: "Feature" as const,
    description: "",
  }
}

export const defaultVersionChange = createDefaultVersionChange()
