import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnDef } from "./types"

type DataTableSkeletonProps<T = unknown> = {
  columns: ColumnDef<T>[]
  rows?: number
  selectable?: boolean
}

function responsiveClass(breakpoint?: string): string {
  switch (breakpoint) {
    case "sm":
      return "hidden sm:block"
    case "md":
      return "hidden md:block"
    case "lg":
      return "hidden lg:block"
    default:
      return ""
  }
}

export function DataTableSkeleton<T = unknown>({ columns, rows = 10, selectable = false }: DataTableSkeletonProps<T>) {
  return (
    <div className="space-y-0 rounded-lg border">
      {/* Header */}
      <div className="flex items-center border-b border-border/70 bg-muted/50 px-3 py-3">
        {selectable && (
          <div className="w-10">
            <Skeleton className="size-5 rounded" />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.key}
            className={`text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase ${
              col.align === "right" ? "text-right" : ""
            } ${col.minWidth ? col.minWidth : "flex-1"} ${responsiveClass(col.responsive)}`}
          >
            {col.header}
          </div>
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-border/60 px-3 py-3 last:border-b-0">
          {selectable && (
            <div className="w-10">
              <Skeleton className="size-5 rounded" />
            </div>
          )}
          {columns.map((col) => (
            <div
              key={col.key}
              className={`${col.minWidth ? col.minWidth : "flex-1"} ${responsiveClass(col.responsive)} ${
                col.align === "right" ? "text-right" : ""
              }`}
            >
              <Skeleton
                className={`h-4 rounded ${col.align === "right" ? "ml-auto" : ""}`}
                style={{ width: col.skeletonWidth ?? 64 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
