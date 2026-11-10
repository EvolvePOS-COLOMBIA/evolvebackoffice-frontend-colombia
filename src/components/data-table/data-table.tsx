import { CheckSquare, Square } from "lucide-react"

import { EmptyState } from "@/components/share/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { DataTableProps } from "./types"
import { DataTableSkeleton } from "./data-table-skeleton"
import { DataTablePagination } from "./data-table-pagination"

// ─── Responsive class mapping ────────────────────────────────────────────────

function responsiveClass(breakpoint?: string): string {
  switch (breakpoint) {
    case "sm":
      return "hidden sm:table-cell"
    case "md":
      return "hidden md:table-cell"
    case "lg":
      return "hidden lg:table-cell"
    default:
      return ""
  }
}

// Ancla una columna al borde derecho del contenedor scrolleable. La sombra
// izquierda da la señal visual de que hay contenido scrolleable debajo.
const STICKY_SHADOW = "shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.25)]"

function stickyRightHeadClass(sticky?: boolean): string {
  return sticky ? `sticky right-0 z-20 bg-muted ${STICKY_SHADOW}` : ""
}

function stickyRightCellClass(sticky?: boolean): string {
  // bg-card calza exacto con el contenedor de la tabla (bg-card) y con hover de
  // la fila (group-hover accent) — sin la franja de tono distinto que causaba
  // bg-background en dark theme.
  return sticky ? `sticky right-0 z-10 bg-card group-hover:bg-accent/50 ${STICKY_SHADOW}` : ""
}

// ─── DataTable ───────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  emptyState,
  rowClassName,
  toolbar,
  selectable = false,
  selectedIds,
  onSelectionChange,
  skeletonRows,
  minWidth,
  labels,
}: DataTableProps<T>) {
  const colSpan = columns.length + (selectable ? 1 : 0)

  const toggleSelectAll = () => {
    if (!onSelectionChange || !selectedIds) return
    if (selectedIds.size === data.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map((_, i) => String(i))))
    }
  }

  const toggleSelect = (id: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  const tableHeader = (
    <TableHeader>
      <TableRow>
        {selectable && (
          <TableHead className="sticky top-0 z-10 w-10">
            <button onClick={toggleSelectAll} className="flex cursor-pointer items-center">
              {selectedIds && selectedIds.size === data.length && data.length > 0 ? (
                <CheckSquare className="size-5 text-primary" />
              ) : (
                <Square className="size-5 text-muted-foreground" />
              )}
            </button>
          </TableHead>
        )}
        {columns.map((col) => (
          <TableHead
            key={col.key}
            className={`sticky top-0 z-10 ${col.minWidth ?? ""} ${responsiveClass(col.responsive)} ${
              col.align === "right" ? "text-right" : ""
            } ${stickyRightHeadClass(col.stickyRight)}`}
          >
            {col.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      {/* Toolbar */}
      {toolbar && <div className="shrink-0">{toolbar}</div>}

      {/* Table */}
      {isLoading ? (
        <DataTableSkeleton columns={columns} rows={skeletonRows} selectable={selectable} minWidth={minWidth} />
      ) : data.length === 0 ? (
        <div className="min-h-0 flex-1">
          <Table containerClassName="h-full bg-card" className={`h-full ${minWidth ?? "min-w-175"}`}>
            {tableHeader}
            <TableBody>
              <TableRow className="h-full border-b-0 bg-card hover:bg-transparent">
                <TableCell colSpan={colSpan} className="h-full">
                  <div className="flex h-full flex-col items-center justify-center">
                    {emptyState ? <EmptyState {...emptyState} /> : null}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <Table containerClassName="h-full bg-card" className={minWidth ?? "min-w-175"}>
            {tableHeader}
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    "group bg-card",
                    rowClassName?.(row) ?? (selectedIds?.has(String(rowIndex)) ? "bg-primary/8" : undefined)
                  )}
                >
                  {selectable && (
                    <TableCell>
                      <button
                        onClick={() => toggleSelect(String(rowIndex))}
                        className="flex cursor-pointer items-center"
                      >
                        {selectedIds?.has(String(rowIndex)) ? (
                          <CheckSquare className="size-5 text-primary" />
                        ) : (
                          <Square className="size-5 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${responsiveClass(col.responsive)} ${col.align === "right" ? "text-right" : ""} ${stickyRightCellClass(col.stickyRight)}`}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        shownCount={data.length}
        selectedCount={selectable && selectedIds ? selectedIds.size : undefined}
        onPageChange={onPageChange}
        labels={labels}
      />
    </div>
  )
}
