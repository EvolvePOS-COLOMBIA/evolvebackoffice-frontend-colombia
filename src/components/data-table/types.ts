import type React from "react"

// ─── Column Configuration ────────────────────────────────────────────────────

export type ColumnBreakpoint = "always" | "sm" | "md" | "lg"

export interface ColumnDef<T> {
  key: string
  header: string
  minWidth?: string
  responsive?: ColumnBreakpoint
  align?: "left" | "right"
  render: (row: T) => React.ReactNode
  skeletonWidth?: number
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── DataTable Props ─────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
  }
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyMessage?: React.ReactNode
  emptyAction?: React.ReactNode
  toolbar?: React.ReactNode
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  skeletonRows?: number
  labels?: {
    previous?: string
    next?: string
    selected?: string
    paginationTotal?: (count: number) => string
    noResults?: (search: string) => string
  }
}
