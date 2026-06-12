import { z } from "zod"

import { CHANGE_CATEGORIES, RELEASE_CHANNELS } from "@/types/domain"
import { isValidSemVer } from "@/utils/version-utils"

export const versionChangeSchema = z.object({
  category: z.enum(CHANGE_CATEGORIES),
  description: z
    .string()
    .trim()
    .min(8, "Change description must contain at least 8 characters."),
})

export const versionSchema = z.object({
  softwareId: z.string().min(1, "Select a software product."),
  versionNumber: z
    .string()
    .trim()
    .refine(isValidSemVer, "Version number must follow the X.Y.Z.W format."),
  summary: z
    .string()
    .trim()
    .min(20, "Summary must contain at least 20 characters."),
  releaseChannel: z.enum(RELEASE_CHANNELS),
  isCritical: z.boolean(),
  releaseDate: z.string().min(1, "Release date is required."),
  zipFileName: z.string().min(1, "Attach a .zip package."),
  zipFileSize: z.number().positive("Attached file is invalid."),
  changes: z.array(versionChangeSchema).min(1, "Add at least one change."),
})

export const defaultVersionChange = {
  category: "Feature",
  description: "",
} as const
