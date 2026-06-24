import { Download, LayoutTemplate, MoveLeft, SquarePen, Info } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import Spinner from "@/components/Spinner"
import { VersionEditDialog } from "@/features/versions/components/version-edit-dialog"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useAllVersions, useVersionPackageDownload } from "@/features/versions/hooks/use-versions"
import { formatBytes, formatDate } from "@/utils/format"
import {
  buildVersionPackageFileName,
  EMPTY_CHANGES,
  getChangeTypeIcon,
  getChangeTypeTone,
  getIconColorClass,
  groupChangesByType,
  RELEASE_TYPE_LABELS,
} from "@/utils/version-utils"
import { cn } from "@/lib/utils"
import type { ChangeType } from "@/types/domain"

export function VersionDetailPage() {
  const { isUserRole } = useAuth()
  const { versionId } = useParams()
  const { data: releaseVersions, isLoading, isError } = useAllVersions()
  const { handleDownloadVersion, isDownloadingVersion } = useVersionPackageDownload()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const version = (releaseVersions ?? []).find((item) => item.id === versionId)
  const changes = version?.changes ?? EMPTY_CHANGES

  const groupedChanges = groupChangesByType(changes)

  const [activeChangeType, setActiveChangeType] = useState<ChangeType | "all">("all")
  const visibleGroups =
    activeChangeType === "all" ? groupedChanges : groupedChanges.filter((group) => group.type === activeChangeType)

  if (isLoading) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-foreground">Loading version details...</h1>
        <p className="mt-3 text-sm text-muted-foreground">Fetching version list from the API.</p>
      </Card>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load version details"
        description="The selected release could not be retrieved from the API."
        eyebrow="Version error"
        icon={LayoutTemplate}
        variant="inline"
        action={
          <Button asChild>
            <Link to="/versions">Back to version history</Link>
          </Button>
        }
      />
    )
  }

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

  const downloadFileName = buildVersionPackageFileName(version.softwareName, version.versionNumber)
  const availableRequiredVersions = (releaseVersions ?? []).filter(
    (item) => item.softwareProductId === version.softwareProductId && item.id !== version.id
  )
  const requiredVersionLabel =
    (releaseVersions ?? []).find((item) => item.id === version.requiredSoftwareVersionId)?.versionNumber ??
    version.requiredSoftwareVersionId ??
    "None Required"

  return (
    <section className="space-y-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link to="/versions">
            <MoveLeft className="size-4" />
            Back to history
          </Link>
        </Button>
        <div className="flex gap-3">
          {!isUserRole && (
            <Button variant="secondary" onClick={() => setIsEditDialogOpen(true)}>
              <SquarePen className="size-4" />
              Edit Version
            </Button>
          )}

          <Button
            disabled={isDownloadingVersion(version.id)}
            onClick={() =>
              handleDownloadVersion({
                versionId: version.id,
                fileName: downloadFileName,
              })
            }
          >
            {isDownloadingVersion(version.id) ? <Spinner IsButton /> : <Download className="size-4" />}
            {isDownloadingVersion(version.id) ? "Downloading..." : "Download .zip"}
          </Button>
        </div>
      </div>

      {!isUserRole && (
        <VersionEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          version={version}
          availableVersions={availableRequiredVersions}
        />
      )}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:p-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{RELEASE_TYPE_LABELS[version.releaseType]}</Badge>
              <Badge tone={version.isMandatory ? "danger" : "neutral"}>
                {version.isMandatory ? "Mandatory" : "Optional"}
              </Badge>
              <Badge tone={version.isPublicDownload ? "success" : "warning"}>
                {version.isPublicDownload ? "Public" : "Internal"}
              </Badge>
              <Badge tone={version.isActive ? "success" : "warning"}>{version.isActive ? "Active" : "Inactive"}</Badge>
              <Badge tone="neutral">{version.changes.length} changes</Badge>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Software Product
                </p>
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                {version?.softwareName ?? "Unknown software"} · {version.versionNumber}
              </h1>
            </div>

            {version.details ? (
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{version.details}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-2">
            <MetaCard label="Published" value={formatDate(version.publishedAtUtc)} />
            <MetaCard label="Required V." value={requiredVersionLabel} />
            <MetaCard label="Package" value={downloadFileName} />
            <MetaCard label="Size" value={formatBytes(version.packageSize ?? 0)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="rounded-[26px] border-border/70 shadow-none">
          <CardHeader className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">ChangeLog</CardTitle>
              <p className="text-sm text-muted-foreground">Filter and review every release note entry.</p>
            </div>

            {groupedChanges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant={activeChangeType === "all" ? "secondary" : "outline"}
                  onClick={() => setActiveChangeType("all")}
                >
                  All
                  <span className="ml-1 text-xs text-muted-foreground">{version.changes.length}</span>
                </Button>

                {groupedChanges.map((group) => {
                  const ChangeIcon = getChangeTypeIcon(group.type)

                  return (
                    <Button
                      key={group.type}
                      type="button"
                      size="xs"
                      variant={activeChangeType === group.type ? "secondary" : "outline"}
                      onClick={() => setActiveChangeType(group.type)}
                    >
                      <ChangeIcon className={`mr-0.5 size-4 ${getIconColorClass(getChangeTypeTone(group.type))}`} />
                      <Badge
                        tone={getChangeTypeTone(group.type)}
                        className="border-transparent bg-transparent px-0 py-0"
                      >
                        {group.type}
                      </Badge>
                      <span className="ml-1 text-xs text-muted-foreground">{group.items.length}</span>
                    </Button>
                  )
                })}
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="grid gap-5">
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => {
                const GroupIcon = getChangeTypeIcon(group.type)

                return (
                  <section key={group.type} className="space-y-3">
                    {/* El encabezado del grupo (Badge + Cantidad) siempre se renderiza arriba */}
                    <div className="flex items-center gap-2">
                      <Badge tone={getChangeTypeTone(group.type)} className="gap-1.5">
                        <GroupIcon className="size-3.5" />
                        {group.type}
                      </Badge>
                      <p className="text-sm font-medium text-foreground">{group.items.length} Change(s)</p>
                    </div>

                    {/* Lista limpia: quitamos list-inside y controlamos el margen con pl-5 para que los puntos se vean bien */}
                    <ul
                      className={cn(
                        "list-disc space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 pl-9",
                        getIconColorClass(getChangeTypeTone(group.type), true)
                      )}
                    >
                      {group.items.map((change) => (
                        <li key={change.id} className="text-sm text-foreground">
                          <p className="leading-7 break-words whitespace-pre-wrap text-foreground">
                            {change.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-4">
                <div className="flex items-center justify-center">
                  <Info className="size-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No changes registered for this version.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
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
