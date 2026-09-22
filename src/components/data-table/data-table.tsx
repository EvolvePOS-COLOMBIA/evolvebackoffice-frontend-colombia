import { CheckSquare, Square } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ColumnDef, DataTableProps } from "./types"
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

// ─── DataTable ───────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  emptyIcon: EmptyIcon,
  emptyMessage,
  emptyAction,
  toolbar,
  selectable = false,
  selectedIds,
  onSelectionChange,
  skeletonRows,
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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      {toolbar && <div className="shrink-0">{toolbar}</div>}

      {/* Table */}
      {isLoading ? (
        <DataTableSkeleton columns={columns} rows={skeletonRows} selectable={selectable} />
      ) : (
        <div className="min-h-0 flex-1">
          <Table containerClassName="h-full" className="min-w-175">
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
                    }`}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan}>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      {EmptyIcon && <EmptyIcon className="mb-3 size-10 opacity-40" />}
                      {emptyMessage && <p className="text-sm">{emptyMessage}</p>}
                      {emptyAction && <div className="mt-4">{emptyAction}</div>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={selectedIds?.has(String(rowIndex)) ? "bg-primary/8" : undefined}>
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
                        className={`${responsiveClass(col.responsive)} ${col.align === "right" ? "text-right" : ""}`}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        selectedCount={selectable && selectedIds ? selectedIds.size : undefined}
        onPageChange={onPageChange}
        labels={labels}
      />
    </div>
  )
}
