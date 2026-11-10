import { generatePageNumbers } from "@/components/data-table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTranslation } from "@/i18n/use-i18n"

type InventoryPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Paginación de las tablas de inventario (mismo patrón del catálogo de artículos). */
export function InventoryPagination({ page, totalPages, onPageChange }: InventoryPaginationProps) {
  const { t } = useTranslation("business-inventory")
  if (totalPages <= 1) return null

  return (
    <Pagination className="w-fit">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text={t("previous")}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          />
        </PaginationItem>
        {generatePageNumbers(page, totalPages).map((pageNum, i) =>
          pageNum === "..." ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <PaginationLink isActive={pageNum === page} onClick={() => onPageChange(pageNum)}>
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            text={t("next")}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
