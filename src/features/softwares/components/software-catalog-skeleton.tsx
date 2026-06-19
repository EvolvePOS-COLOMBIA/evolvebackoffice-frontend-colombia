import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SoftwareCatalogSkeleton() {
  // Generamos un arreglo ficticio de 4 elementos para simular las filas cargando
  const skeletonRows = Array.from({ length: 3 }, (_, index) => ({
    id: index,
    name: `Software ${index + 1}`,
    description: `Description ${index + 1}`,
    isActive: true,
  }))

  return (
    <div className="space-y-6">
      {/* CARD SUPERIOR: Encabezado y Métricas */}
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

          {/* Skeletons para los SummaryTiles */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Software products
                </p>
                <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
              </CardContent>
            </Card>
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Registered versions
                </p>
                <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN INTERMEDIA: Títulos de sección y botón */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:pl-1 lg:pl-3">
          <p className="text-sm font-medium text-foreground">Available software products</p>
          <p className="text-sm text-muted-foreground">Name, description, and release count.</p>
        </div>
        {/* Esqueleto del botón "Add Software" si aplica */}
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* CARD PRINCIPAL: Tabla y Vista Móvil */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Catalog Table</CardTitle>
          <CardDescription>Fast scan for software metadata and release counts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* VISTA ESCRITORIO (xl:block) */}
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonRows.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-18" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* VISTA MÓVIL (xl:hidden) */}
          <div className="grid gap-4 xl:hidden">
            {skeletonRows.map((_, index) => (
              <Card key={index} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="w-full space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>

                  <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
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
