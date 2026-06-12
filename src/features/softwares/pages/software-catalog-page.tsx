import { useMemo, useState } from "react"
import { Boxes, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SoftwareFormDialog } from "@/features/softwares/components/software-form-dialog"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/utils/format"

export function SoftwareCatalogPage() {
  const softwareProducts = useAppStore((state) => state.softwareProducts)
  const releaseVersions = useAppStore((state) => state.releaseVersions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const softwareCards = useMemo(
    () =>
      softwareProducts.map((software) => ({
        ...software,
        totalVersions: releaseVersions.filter(
          (version) => version.softwareId === software.id
        ).length,
      })),
    [releaseVersions, softwareProducts]
  )

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">Master catalog</Badge>
            <div>
              <h1 className="text-balance text-3xl font-semibold text-foreground">
                Register and review every software product.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                From here you can register and review every software product and
                inspect the release metadata below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile
              label="Software products"
              value={softwareProducts.length}
            />
            <SummaryTile
              label="Registered versions"
              value={releaseVersions.length}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:pl-1 lg:pl-3">
          <p className="text-sm font-medium text-foreground">
            Available software products
          </p>
          <p className="text-sm text-muted-foreground">
            Name, code, description, and release count.
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)} className="sm:self-start">
          <Plus className="size-4" />
          Add Software
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Catalog Table</CardTitle>
          <CardDescription>
            Fast scan for software metadata and release counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {softwareCards.map((software) => (
                  <TableRow key={software.id}>
                    <TableCell className="font-medium">{software.name}</TableCell>
                    <TableCell>
                      <Badge tone="neutral">{software.code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-2xl text-muted-foreground">
                      {software.description}
                    </TableCell>
                    <TableCell>
                      <Badge tone="primary">
                        {software.totalVersions} versions
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(software.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {softwareCards.map((software) => (
              <Card
                key={software.id}
                className="rounded-[24px] border-border/70 bg-background/45 shadow-none"
              >
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {software.name}
                      </h3>
                      <Badge tone="neutral" className="w-fit">
                        {software.code}
                      </Badge>
                    </div>
                    <Badge tone="primary" className="w-fit">
                      {software.totalVersions} versions
                    </Badge>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground">
                    {software.description}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <CompactMeta label="Created" value={formatDate(software.createdAt)} />
                    <CompactMeta
                      label="Release Count"
                      value={`${software.totalVersions} versions`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {softwareCards.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
            <Boxes className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No software products yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first product to unlock the version builder.
          </p>
        </Card>
      ) : null}

      <SoftwareFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function SummaryTile({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
