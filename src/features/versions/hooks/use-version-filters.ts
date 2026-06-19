import { useMemo, useState } from "react"

import {
  defaultVersionFilters,
  type VersionFilters,
} from "@/features/versions/types/version-types"
import type { SoftwareVersionResponse } from "@/types/domain"
import { sortVersionsByPublishedAt } from "@/utils/version-utils"

export function useVersionFilters(versions: SoftwareVersionResponse[]) {
  const [filters, setFilters] = useState<VersionFilters>(defaultVersionFilters)

  const filteredVersions = useMemo(() => {
    return sortVersionsByPublishedAt(versions).filter((version) => {
      const matchesSoftware =
        filters.softwareId === "all" ||
        version.softwareProductId === filters.softwareId
      const matchesType =
        filters.releaseType === "all" || version.releaseType === filters.releaseType
      const matchesMandatory =
        filters.mandatory === "all" ||
        (filters.mandatory === "mandatory" && version.isMandatory) ||
        (filters.mandatory === "optional" && !version.isMandatory)

      return matchesSoftware && matchesType && matchesMandatory
    })
  }, [filters, versions])

  return {
    filters,
    setFilters,
    filteredVersions,
  }
}
