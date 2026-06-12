import type { z } from "zod"

import {
  defaultVersionChange,
  versionChangeSchema,
  versionSchema,
} from "@/features/versions/schemas/version-schema"
import type { ReleaseChannel } from "@/types/domain"

export type VersionFormValues = z.infer<typeof versionSchema>
export type VersionChangeFormValues = z.infer<typeof versionChangeSchema>

export type VersionFilters = {
  softwareId: string
  releaseChannel: ReleaseChannel | "all"
  criticality: "all" | "critical" | "standard"
}

export const defaultVersionFilters: VersionFilters = {
  softwareId: "all",
  releaseChannel: "all",
  criticality: "all",
}

export const emptyVersionChange = { ...defaultVersionChange }
