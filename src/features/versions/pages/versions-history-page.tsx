import { ArrowRight, Download, Info, LayoutTemplate, Plus } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VersionHistoryFilters } from "@/features/versions/components/version-history-filters"
import { useSoftwares } from "@/features/softwares/hooks/use-softwares"
import { useAllVersions, useVersionPackageDownload } from "@/features/versions/hooks/use-versions"
import { ReleaseType } from "@/types/domain"
import { formatDate, formatDateTime } from "@/utils/format"
import { buildVersionPackageFileName } from "@/utils/version-utils"
import { useVersionFilters } from "../hooks/use-version-filters"
import { VersionHistorySkeleton } from "../components/version-history-skeleton"
import Spinner from "@/components/Spinner"

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  [ReleaseType.Development]: "Development",
  [ReleaseType.Testing]: "Testing",
  [ReleaseType.Staging]: "Staging",
  [ReleaseType.Production]: "Production",
  [ReleaseType.Preview]: "Preview",
  [ReleaseType.Beta]: "Beta",
}

export function VersionsHistoryPage() {
  const { data: softwareProducts, isLoading: isLoadingSoftwares, isError: isErrorSoftwares } = useSoftwares()
  const { data: releaseVersions, isLoading: isLoadingVersions, isError: isErrorVersions } = useAllVersions()
  const { handleDownloadVersion, isDownloadingVersion } = useVersionPackageDownload()

  const { filters, setFilters, filteredVersions } = useVersionFilters(releaseVersions ?? [])

  if (isLoadingVersions || isLoadingSoftwares) return <VersionHistorySkeleton />

  if (isErrorSoftwares && isErrorVersions) {
    return (
      <ErrorState
        title="Unable to load software list"
        description="The history view cannot prepare its filters because the API failed while loading software products."
        eyebrow="History error"
        icon={LayoutTemplate}
        variant="inline"
      />
    )
  }

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
            <Kpi label="Total versions" value={releaseVersions?.length ?? 0} />
            <Kpi label="Mandatory" value={(releaseVersions ?? []).filter((version) => version.isMandatory).length} />
            <Kpi label="Products" value={softwareProducts?.length ?? 0} />
          </div>
        </CardContent>
      </Card>

      <VersionHistoryFilters
        filters={filters}
        onChange={setFilters}
        softwareProducts={(softwareProducts ?? []).map((software) => ({
          id: software.id,
          name: software.name,
        }))}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col justify-between gap-2">
            <CardTitle>Release Matrix</CardTitle>
            <CardDescription className="-mt-2">Chronological overview of every product release.</CardDescription>
          </div>
          <Button variant="default" asChild>
            <Link to="/versions/new">
              <Plus className="size-4" />
              Add Version
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingVersions ? (
            <Card className="border-border/70 bg-background/45 shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">Loading versions...</CardContent>
            </Card>
          ) : null}

          {isErrorVersions ? (
            <ErrorState
              variant="inline"
              title="Unable to load versions"
              description="The API returned an error while loading the release timeline."
              eyebrow="Timeline error"
              icon={LayoutTemplate}
            />
          ) : null}

          {filteredVersions.length === 0 && !isLoadingVersions && !isErrorVersions ? (
            <Card className="flex flex-col items-center justify-center p-7 text-center">
              <Info className="mb-2 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">No versions match the current filters</h2>
              <p className="text-sm text-muted-foreground">
                Try a less restrictive combination or create a new version.
              </p>
            </Card>
          ) : (
            <div className="hidden xl:block">
              <Table>
                <TableHeader>
                  <TableRow className="text-nowrap">
                    <TableHead>Software</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Release type</TableHead>
                    <TableHead>Mandatory</TableHead>
                    <TableHead className="text-nowrap">Release date</TableHead>
                    <TableHead className="text-nowrap">Public</TableHead>
                    <TableHead className="text-nowrap">Changes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVersions.map((version) => {
                    const downloadFileName = buildVersionPackageFileName(version.softwareName, version.versionNumber)

                    return (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.softwareName ?? "Unknown software"}</TableCell>
                        <TableCell>{version.versionNumber}</TableCell>
                        <TableCell>
                          <Badge tone="primary">{RELEASE_TYPE_LABELS[version.releaseType]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge tone={version.isMandatory ? "danger" : "neutral"}>
                            {version.isMandatory ? "Mandatory" : "Optional"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(version.publishedAtUtc)}</TableCell>

                        <TableCell>
                          <Badge tone={version.isPublicDownload ? "success" : "danger"}>
                            {version.isPublicDownload ? "Public" : "No Public"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center font-semibold">{version.changes.length}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/versions/${version.id}`}>
                                View Details
                                <ArrowRight className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              disabled={isDownloadingVersion(version.id)}
                              onClick={() =>
                                handleDownloadVersion({
                                  versionId: version.id,
                                  fileName: downloadFileName,
                                })
                              }
                            >
                              {isDownloadingVersion(version.id) ? (
                                <Spinner IsButton />
                              ) : (
                                <Download className="size-4" />
                              )}
                              {isDownloadingVersion(version.id) ? "Downloading..." : "Download"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid gap-4 xl:hidden">
            {filteredVersions.map((version) => {
              const software = (softwareProducts ?? []).find((item) => item.id === version.softwareProductId)
              const downloadFileName = buildVersionPackageFileName(version.softwareName, version.versionNumber)

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
                        <Badge tone="primary">{RELEASE_TYPE_LABELS[version.releaseType]}</Badge>
                        <Badge tone={version.isMandatory ? "danger" : "neutral"}>
                          {version.isMandatory ? "Mandatory" : "Optional"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ResponsiveMeta label="Published" value={formatDate(version.publishedAtUtc)} />
                      {/* <ResponsiveMeta label="Package" value={version.packageFileName ?? "—"} /> */}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/versions/${version.id}`}>
                          View Details
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        disabled={isDownloadingVersion(version.id)}
                        onClick={() =>
                          handleDownloadVersion({
                            versionId: version.id,
                            fileName: downloadFileName,
                          })
                        }
                      >
                        {isDownloadingVersion(version.id) ? <Spinner IsButton /> : <Download className="size-4" />}
                        {isDownloadingVersion(version.id) ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
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
