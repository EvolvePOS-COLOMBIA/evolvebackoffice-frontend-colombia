import { ArrowRight, Download } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VersionHistoryFilters } from "@/features/versions/components/version-history-filters"
import { useVersionFilters } from "@/features/versions/hooks/use-version-filters"
import { useAppStore } from "@/store/app-store"
import { RELEASE_CHANNEL_LABELS } from "@/types/domain"
import { formatDate } from "@/utils/format"
import { downloadMockPackage, getSoftwareById } from "@/utils/version-utils"

export function VersionsHistoryPage() {
  const softwareProducts = useAppStore((state) => state.softwareProducts)
  const releaseVersions = useAppStore((state) => state.releaseVersions)
  const { filters, setFilters, filteredVersions } = useVersionFilters(releaseVersions)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">Global release view</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">
                Every version, one readable timeline.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Filter by product, channel, or criticality to focus on the releases that matter right now.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Total versions" value={releaseVersions.length} />
            <Kpi label="Critical" value={releaseVersions.filter((version) => version.isCritical).length} />
            <Kpi label="Products" value={softwareProducts.length} />
          </div>
        </CardContent>
      </Card>

      <VersionHistoryFilters filters={filters} onChange={setFilters} softwareProducts={softwareProducts} />

      <Card>
        <CardHeader>
          <CardTitle>Release Matrix</CardTitle>
          <CardDescription>Chronological overview of every product release.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead className="text-nowrap">Release Date</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVersions.map((version) => {
                  const software = getSoftwareById(softwareProducts, version.softwareId)

                  return (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">{software?.name ?? "Unknown software"}</TableCell>
                      <TableCell>{version.versionNumber}</TableCell>
                      <TableCell>
                        <Badge tone="primary">{RELEASE_CHANNEL_LABELS[version.releaseChannel]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={version.isCritical ? "danger" : "neutral"}>
                          {version.isCritical ? "Critical" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(version.releaseDate)}</TableCell>
                      <TableCell className="max-w-[260px] truncate text-muted-foreground">
                        {version.zipFileName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/versions/${version.id}`}>
                              View Details
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => downloadMockPackage(version, software)}>
                            <Download className="size-4" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {filteredVersions.map((version) => {
              const software = getSoftwareById(softwareProducts, version.softwareId)

              return (
                <Card key={version.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {software?.name ?? "Unknown software"}
                        </h3>
                        <p className="text-sm text-muted-foreground">Version {version.versionNumber}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="primary">{RELEASE_CHANNEL_LABELS[version.releaseChannel]}</Badge>
                        <Badge tone={version.isCritical ? "danger" : "neutral"}>
                          {version.isCritical ? "Critical" : "Standard"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ResponsiveMeta label="Release Date" value={formatDate(version.releaseDate)} />
                      <ResponsiveMeta label="Package" value={version.zipFileName} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/versions/${version.id}`}>
                          View Details
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button size="sm" onClick={() => downloadMockPackage(version, software)}>
                        <Download className="size-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {filteredVersions.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">No versions match the current filters</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a less restrictive combination or create a new version.
          </p>
        </Card>
      ) : null}
    </div>
  )
}

function ResponsiveMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium break-words text-foreground">{value}</p>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
