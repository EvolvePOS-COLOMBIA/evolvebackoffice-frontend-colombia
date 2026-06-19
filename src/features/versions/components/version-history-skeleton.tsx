import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function VersionHistorySkeleton() {
  // Simulamos una carga de 5 versiones en el listado
  const skeletonItems = Array.from({ length: 2 })

  return (
    <div className="space-y-6">
      {/* CARD SUPERIOR: Contexto Global y Contadores KPIs */}
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

          {/* Skeletons para los bloques KPI */}
          <div className="grid gap-3 sm:grid-cols-3">
            {["Total versions", "Mandatory", "Products"].map((label, index) => (
              <Card key={index} className="rounded-3xl">
                <CardContent className="px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
                  <Skeleton className="mt-2 h-8 w-10 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CONTENEDOR DE FILTROS: Mantiene la estructura visual de inputs vacíos */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </Card>

      {/* CARD PRINCIPAL: Tabla Matrix y Tarjetas Móviles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col justify-between gap-2">
            <CardTitle>Release Matrix</CardTitle>
            <CardDescription className="-mt-2">Chronological overview of every product release.</CardDescription>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* VISTA ESCRITORIO (xl:block) */}
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow className="text-nowrap">
                  <TableHead>Software</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Release type</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Release date</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonItems.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-5 w-6" />
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* VISTA MÓVIL (xl:hidden) */}
          <div className="grid gap-4 xl:hidden">
            {skeletonItems.map((_, index) => (
              <Card key={index} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        Published
                      </p>
                      <Skeleton className="mt-2 h-5 w-28" />
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        Public
                      </p>
                      <Skeleton className="mt-2 h-5 w-16" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Skeleton className="h-8 w-full rounded-md sm:w-28" />
                    <Skeleton className="h-8 w-full rounded-md sm:w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
