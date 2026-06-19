import { Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VersionFilters } from "@/features/versions/types/version-types"
import { ReleaseType } from "@/types/domain"

type SoftwareOption = {
  id: string
  name: string
}

type VersionHistoryFiltersProps = {
  filters: VersionFilters
  onChange: (filters: VersionFilters) => void
  softwareProducts: SoftwareOption[]
}

export function VersionHistoryFilters({ filters, onChange, softwareProducts }: VersionHistoryFiltersProps) {
  const releaseTypeOptions: Array<{ value: ReleaseType; label: string }> = [
    { value: ReleaseType.Development, label: "Development" },
    { value: ReleaseType.Testing, label: "Testing" },
    { value: ReleaseType.Staging, label: "Staging" },
    { value: ReleaseType.Production, label: "Production" },
    { value: ReleaseType.Preview, label: "Preview" },
    { value: ReleaseType.Beta, label: "Beta" },
  ]

  return (
    <Card>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Filter className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Live Filters</p>
            <p className="text-sm text-muted-foreground">
              Narrow results by product, release type, and mandatory status.
            </p>
          </div>
          <Badge tone="neutral" className="w-fit sm:ml-auto">
            Interactive
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label>Software Product</Label>
            <Select
              value={filters.softwareId}
              onValueChange={(softwareId) =>
                onChange({
                  ...filters,
                  softwareId,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {softwareProducts.map((software) => (
                  <SelectItem key={software.id} value={software.id}>
                    {software.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Release Type</Label>
            <Select
              value={String(filters.releaseType)}
              onValueChange={(releaseType) =>
                onChange({
                  ...filters,
                  releaseType: releaseType === "all" ? "all" : (Number(releaseType) as ReleaseType),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {releaseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mandatory</Label>
            <Select
              value={filters.mandatory}
              onValueChange={(mandatory) =>
                onChange({
                  ...filters,
                  mandatory: mandatory as VersionFilters["mandatory"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="mandatory">Mandatory</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
