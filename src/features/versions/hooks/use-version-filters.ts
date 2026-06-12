import { useMemo, useState } from "react"

import {
  defaultVersionFilters,
  type VersionFilters,
} from "@/features/versions/types/version-types"
import type { ReleaseVersion } from "@/types/domain"
import { sortVersionsByReleaseDate } from "@/utils/version-utils"

export function useVersionFilters(versions: ReleaseVersion[]) {
  const [filters, setFilters] = useState<VersionFilters>(defaultVersionFilters)

  const filteredVersions = useMemo(() => {
    return sortVersionsByReleaseDate(versions).filter((version) => {
      const matchesSoftware =
        filters.softwareId === "all" || version.softwareId === filters.softwareId
      const matchesChannel =
        filters.releaseChannel === "all" ||
        version.releaseChannel === filters.releaseChannel
      const matchesCriticality =
        filters.criticality === "all" ||
        (filters.criticality === "critical" && version.isCritical) ||
        (filters.criticality === "standard" && !version.isCritical)

      return matchesSoftware && matchesChannel && matchesCriticality
    })
  }, [filters, versions])

  return {
    filters,
    setFilters,
    filteredVersions,
  }
}
