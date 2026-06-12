import { Download, MoveLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/store/app-store"
import { RELEASE_CHANNEL_LABELS } from "@/types/domain"
import { formatBytes, formatDate, formatDateTime } from "@/utils/format"
import { downloadMockPackage, getSoftwareById, groupChangesByCategory } from "@/utils/version-utils"

const groupToneClasses: Record<string, string> = {
  Feature: "border-emerald-400/20 bg-emerald-500/8",
  "Bug Fix": "border-rose-400/20 bg-rose-500/8",
  Improvement: "border-cyan-400/20 bg-cyan-500/8",
  Security: "border-amber-400/20 bg-amber-500/8",
  Deprecated: "border-orange-400/20 bg-orange-500/8",
  Removed: "border-violet-400/20 bg-violet-500/8",
  Others: "border-white/10 bg-white/5",
}

export function VersionDetailPage() {
  const { versionId } = useParams()
  const softwareProducts = useAppStore((state) => state.softwareProducts)
  const releaseVersions = useAppStore((state) => state.releaseVersions)

  const version = releaseVersions.find((item) => item.id === versionId)

  if (!version) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-foreground">Version not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The requested version does not exist or was removed from local storage.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/versions">Back to version history</Link>
        </Button>
      </Card>
    )
  }

  const software = getSoftwareById(softwareProducts, version.softwareId)
  const changeGroups = groupChangesByCategory(version.changes)

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link to="/versions">
            <MoveLeft className="size-4" />
            Back to history
          </Link>
        </Button>
        <Button onClick={() => downloadMockPackage(version, software)}>
          <Download className="size-4" />
          Download .zip
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:p-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{RELEASE_CHANNEL_LABELS[version.releaseChannel]}</Badge>
              <Badge tone={version.isCritical ? "danger" : "neutral"}>
                {version.isCritical ? "Critical" : "Standard"}
              </Badge>
              {software ? <Badge tone="neutral">{software.code}</Badge> : null}
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Software Product
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                {software?.name ?? "Unknown software"} · {version.versionNumber}
              </h1>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{version.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-2">
            <MetaCard label="Release Date" value={formatDate(version.releaseDate)} />
            <MetaCard label="Package" value={version.zipFileName} />
            <MetaCard label="Size" value={formatBytes(version.zipFileSize)} />
            <MetaCard label="Created At" value={formatDateTime(version.createdAt)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {changeGroups.map((group) => (
          <Card key={group.type} className={`border ${groupToneClasses[group.type]}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{group.label}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {group.items.length} change(s) grouped automatically by the frontend.
                </p>
              </div>
              <Badge tone="neutral">{group.items.length} items</Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {group.items.map((item, index) => (
                <Card key={item.id} className="rounded-3xl border-border/70 bg-background/55 shadow-none">
                  <CardContent className="px-5 py-4">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                      Change {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-3xl shadow-none">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-3 text-sm leading-6 break-words text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
