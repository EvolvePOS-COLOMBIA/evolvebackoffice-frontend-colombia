import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardSkeleton() {
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
            {["Total software", "Total versions", "Downloads (30d)"].map((label) => (
              <Card key={label} className="rounded-3xl shadow-none">
                <CardContent className="px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
                  <Skeleton className="mt-2 h-8 w-12 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[26px] border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Recent Releases</CardTitle>
              <CardDescription>Last published versions across all products.</CardDescription>
            </div>
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[26px] border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Top Downloaded Software</CardTitle>
              <CardDescription>Most downloaded products in the current window.</CardDescription>
            </div>
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
