import type { z } from "zod"

import {
  createDefaultVersionChange,
  updateVersionSchema,
  versionChangeSchema,
  versionSchema,
} from "@/features/versions/schemas/version-schema"
import type { ReleaseType } from "@/types/domain"

export type VersionFormValues = z.infer<typeof versionSchema>
export type UpdateVersionFormValues = z.infer<typeof updateVersionSchema>
export type VersionChangeFormValues = z.infer<typeof versionChangeSchema>

export type VersionFilters = {
  softwareId: string
  releaseType: ReleaseType | "all"
  mandatory: "all" | "mandatory" | "optional"
}

export const defaultVersionFilters: VersionFilters = {
  softwareId: "all",
  releaseType: "all",
  mandatory: "all",
}

export const emptyVersionChange = createDefaultVersionChange()
