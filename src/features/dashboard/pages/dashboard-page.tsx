import { ArrowUpRight, BarChart3, Boxes, Download, LayoutTemplate } from "lucide-react"
import { Link } from "react-router-dom"
import type { ComponentType } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton"
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard"
import { formatDateTime } from "@/utils/format"
import { RELEASE_TYPE_LABELS } from "@/utils/version-utils"

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError || !data) {
    return (
      <ErrorState
        eyebrow="Dashboard"
        title="Unable to load dashboard"
        description="The dashboard summary endpoint did not return data."
        icon={BarChart3}
        variant="inline"
        action={
          <Button asChild>
            <Link to="/versions">Go to Version History</Link>
          </Button>
        }
      />
    )
  }

  const recentReleases = data.recentReleases ?? []
  const topDownloadedSoftware = data.topDownloadedSoftware ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">Overview</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-balance text-foreground">Control Center Dashboard</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Monitor releases, adoption signals and download activity across every software product.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Total software" value={formatCount(data.totalSoftware)} icon={Boxes} tone="primary" />
            <KpiCard
              label="Total versions"
              value={formatCount(data.totalVersions)}
              icon={LayoutTemplate}
              tone="warning"
            />
            {/* <KpiCard
              label="Public versions"
              value={formatCount(data.publicVersions)}
              icon={ArrowUpRight}
              tone="success"
            /> */}
            <KpiCard
              label="Downloads (30d)"
              value={formatCount(data.downloadsLast30Days)}
              icon={Download}
              tone="purple"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[26px] border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Recent Releases</CardTitle>
              <CardDescription>Last published versions across all products.</CardDescription>
            </div>
            <Button variant="default" asChild>
              <Link to="/versions">
                View all
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReleases.length > 0 ? (
              recentReleases.map((release) => (
                <Link
                  key={release.versionId}
                  to={`/versions/${release.versionId}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-4 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {release.softwareName ?? "Unknown software"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {release.versionNumber ?? "—"} · {formatDateTime(release.publishedAtUtc)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {release.releaseType ? (
                      <Badge tone="neutral">{RELEASE_TYPE_LABELS[release.releaseType]}</Badge>
                    ) : null}
                    <Badge tone="primary">Open</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4 text-sm text-muted-foreground">
                No releases were returned by the API yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[26px] border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Top Downloaded Software</CardTitle>
              <CardDescription>Most downloaded products in the current window.</CardDescription>
            </div>
            <Button variant="default" asChild>
              <Link to="/softwares">
                Open catalog
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDownloadedSoftware.length > 0 ? (
              topDownloadedSoftware.map((item) => (
                <div
                  key={item.softwareId}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.softwareName ?? "Unknown software"}</p>
                    <p className="text-sm text-muted-foreground">Downloads: {formatCount(item.downloadCount)}</p>
                  </div>
                  <Badge tone="purple" className="w-fit">
                    {formatCount(item.downloadCount)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4 text-sm text-muted-foreground">
                No download ranking data was returned by the API yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  tone: "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange"
}) {
  return (
    <Card className="rounded-3xl shadow-none">
      <CardContent className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
          <Badge tone={tone} className="gap-1.5">
            <Icon className="size-3.5" />
          </Badge>
        </div>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
