import { useMemo, useState } from "react"
import { Boxes, Plus, SquarePen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SoftwareFormDialog } from "@/features/softwares/components/software-form-dialog"
import { useDeleteSoftware, useSoftwares } from "@/features/softwares/hooks/use-softwares"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { formatDate } from "@/utils/format"
import { useAllVersions } from "@/features/versions/hooks/use-versions"
import { AlertDeleteDialog } from "@/components/alert-delete-dialog"
import { SoftwareCatalogSkeleton } from "../components/software-catalog-skeleton"
import type { SoftwareResponse } from "@/types/domain"

export function SoftwareCatalogPage() {
  const { isUserRole } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [softwareToEdit, setSoftwareToEdit] = useState<SoftwareResponse | null>(null)

  const { data: softwareProducts, isLoading, isError } = useSoftwares()
  const { data: releaseVersions } = useAllVersions()
  const { mutateAsync: deleteSoftware } = useDeleteSoftware()

  const softwareCards = useMemo(() => softwareProducts ?? [], [softwareProducts])

  const handleDeleteSoftware = (software: SoftwareResponse) => {
    void notify.promise(deleteSoftware(software.id), {
      loading: `Deleting ${software.name}...`,
      success: `${software.name} was deleted.`,
      error: (error) => (error instanceof Error ? error.message : `Could not delete ${software.name}.`),
    })
  }

  if (isLoading) return <SoftwareCatalogSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Unable to load software catalog"
        description="The catalog could not be loaded because the API is unavailable or returned an invalid response."
        eyebrow="Softwares error"
        icon={Boxes}
        variant="inline"
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">Master catalog</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">
                Register and review every software product.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                From here you can inspect the release metadata below of every software product.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="Software products" value={softwareProducts?.length ?? 0} />
            <SummaryTile label="Registered versions" value={releaseVersions?.length ?? 0} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:pl-1 lg:pl-3">
          <p className="text-sm font-medium text-foreground">Available software products</p>
          <p className="text-sm text-muted-foreground">Name, description, and release count.</p>
        </div>

        {!isUserRole && (
          <Button
            className="sm:self-start"
            onClick={() => {
              setSoftwareToEdit(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            Add Software
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Catalog Table</CardTitle>
          <CardDescription>Fast scan for software metadata and release counts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {!isUserRole ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {softwareCards.map((software) => (
                  <TableRow key={software.id}>
                    <TableCell className="font-medium">{software.name}</TableCell>
                    <TableCell>
                      <p className="max-w-lg text-muted-foreground">
                        {software.description ? `${software.description.slice(0, 140)}...` : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-nowrap">
                      <Badge tone={"primary"}>{`${software.countVersions ?? 0} versions`}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={software.isActive ? "success" : "warning"}>
                        {software.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-nowrap">{formatDate(software.createdAtUtc)}</TableCell>
                    {!isUserRole ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSoftwareToEdit(software)
                              setIsDialogOpen(true)
                            }}
                          >
                            <SquarePen className="size-4" />
                            Edit
                          </Button>
                          <AlertDeleteDialog
                            title="Delete Software"
                            description="This action cannot be undone. You are about to remove"
                            selectedLabel={software.name}
                            onDelete={() => handleDeleteSoftware(software)}
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {softwareCards.map((software) => (
              <Card key={software.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">{software.name}</h3>
                      <div className="flex gap-2">
                        <Badge tone="primary" className="w-fit">
                          {software.countVersions ?? 0} versions
                        </Badge>
                        <Badge tone="neutral" className="w-fit">
                          {formatDate(software.createdAtUtc)}
                        </Badge>
                      </div>
                    </div>
                    <Badge tone={software.isActive ? "success" : "warning"} className="w-fit">
                      {software.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground">{software.description ?? "—"}</p>

                  {!isUserRole && (
                    <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSoftwareToEdit(software)
                          setIsDialogOpen(true)
                        }}
                      >
                        <SquarePen className="size-4" />
                        Edit
                      </Button>
                      <AlertDeleteDialog
                        title="Delete Software"
                        description="Are you sure you want to delete this software product? "
                        selectedLabel={software.name}
                        onDelete={() => handleDeleteSoftware(software)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isUserRole && (
        <SoftwareFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setSoftwareToEdit(null)
          }}
          softwareToEdit={softwareToEdit}
        />
      )}

      {softwareCards.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
            <Boxes className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No software products yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {!isUserRole ? "Add your first product to unlock the version builder." : "No software products available."}
          </p>
        </Card>
      ) : null}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
