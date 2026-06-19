import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function UserManagerSkeleton() {
  // Simulamos una grilla cargando 3 usuarios por defecto
  const skeletonUsers = Array.from({ length: 3 })

  return (
    <div className="space-y-6">
      {/* CARD SUPERIOR: Encabezado del Directorio y Resumen de Totales */}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.7fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">User directory</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">
                Manage users and access to Version Manager.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Create, review, and remove accounts. Backend integration will be added later.
              </p>
            </div>
          </div>

          {/* Skeletons para los SummaryTiles */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Total users
                </p>
                <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
              </CardContent>
            </Card>
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Active Users
                </p>
                <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* CARD PRINCIPAL: Control de Búsqueda y Listado */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>User Manager</CardTitle>
              <CardDescription>Search by username, email, or full name.</CardDescription>
            </div>
            <Skeleton className="h-9 w-32 rounded-md sm:self-start" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Fila de Barra de Búsqueda */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* VISTA ESCRITORIO (xl:block) */}
          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonUsers.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
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
            {skeletonUsers.map((_, index) => (
              <Card key={index} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-36" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>

                  {/* Bloques de Metadatos Compactos */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        Email
                      </p>
                      <Skeleton className="mt-2 h-4 w-40" />
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        Created
                      </p>
                      <Skeleton className="mt-2 h-4 w-28" />
                    </div>
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
