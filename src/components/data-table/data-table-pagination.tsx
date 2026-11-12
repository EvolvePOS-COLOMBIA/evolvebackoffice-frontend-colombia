import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { generatePageNumbers } from "./generate-page-numbers"
import { computeReachedCount } from "./reached-count"

// ─── DataTablePagination ─────────────────────────────────────────────────────

type DataTablePaginationProps = {
  currentPage: number
  totalPages: number
  totalCount: number
  shownCount?: number
  selectedCount?: number
  onPageChange: (page: number) => void
  labels?: {
    previous?: string
    next?: string
    selected?: string
    paginationTotal?: (count: number) => string
    paginationProgress?: (count: number, total: number) => string
  }
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  shownCount,
  selectedCount,
  onPageChange,
  labels,
}: DataTablePaginationProps) {
  const reached = computeReachedCount(currentPage, shownCount ?? 0, totalCount, totalPages)

  let summary: string
  if (reached != null && labels?.paginationProgress) {
    summary = labels.paginationProgress(reached, totalCount)
  } else if (labels?.paginationTotal) {
    summary = labels.paginationTotal(totalCount)
  } else {
    summary = `${totalCount} items total`
  }

  return (
    <div className="flex w-full shrink-0 items-center justify-between">
      <p className="min-w-fit text-xs text-muted-foreground">
        {summary}
        {selectedCount != null && selectedCount > 0 && (
          <span className="ml-2 text-primary">
            · {selectedCount} {labels?.selected ?? "selected"}
          </span>
        )}
      </p>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={labels?.previous ?? "Previous"}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              />
            </PaginationItem>
            {generatePageNumbers(currentPage, totalPages).map((pageNum, i) =>
              pageNum === "..." ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink isActive={pageNum === currentPage} onClick={() => onPageChange(pageNum)}>
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                text={labels?.next ?? "Next"}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
