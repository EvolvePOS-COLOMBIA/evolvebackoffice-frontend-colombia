import { Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { VersionFilters } from "@/features/versions/types/version-types"
import {
  RELEASE_CHANNEL_LABELS,
  RELEASE_CHANNELS,
  type SoftwareProduct,
} from "@/types/domain"

type VersionHistoryFiltersProps = {
  filters: VersionFilters
  onChange: (filters: VersionFilters) => void
  softwareProducts: SoftwareProduct[]
}

export function VersionHistoryFilters({
  filters,
  onChange,
  softwareProducts,
}: VersionHistoryFiltersProps) {
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
              Narrow results by product, release channel, and criticality.
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
            <Label>Release Channel</Label>
            <Select
              value={filters.releaseChannel}
              onValueChange={(releaseChannel) =>
                onChange({
                  ...filters,
                  releaseChannel: releaseChannel as VersionFilters["releaseChannel"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {RELEASE_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {RELEASE_CHANNEL_LABELS[channel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Criticality</Label>
            <Select
              value={filters.criticality}
              onValueChange={(criticality) =>
                onChange({
                  ...filters,
                  criticality: criticality as VersionFilters["criticality"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
