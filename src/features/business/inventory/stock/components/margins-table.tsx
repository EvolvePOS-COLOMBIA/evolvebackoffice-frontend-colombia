import { useState } from "react"
import { PackageX, Search, SearchX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import type { Branch } from "@/features/business/branches/types"
import { useTranslation } from "@/i18n/use-i18n"
import { useMargins } from "../../hooks/use-sales"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import { buildMarginsColumns } from "./margins-columns"

/** Margen actual de cada producto de la sucursal: precio sin impuestos − costo. */
export function MarginsTable({ branch }: { branch: Branch }) {
  const { t } = useTranslation("business-inventory")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMargins({ branchId: branch.id, search, pageNumber: page })
  const rows = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  return (
    <DataTable
      columns={buildMarginsColumns(t, { isSupplier: branch.isSupplier })}
      data={rows}
      isLoading={isLoading}
      page={page}
      totalPages={totalPages}
      totalCount={data?.totalCount ?? 0}
      onPageChange={setPage}
      skeletonRows={5}
      minWidth={branch.isSupplier ? "min-w-[860px]" : "min-w-[720px]"}
      toolbar={
        // Misma fila/mismo markup que el toolbar de Existencias (renderToolbarZone).
        <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="margenes-buscar"
              placeholder={t("search_products")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-8 pl-9 sm:h-9"
            />
          </div>
        </div>
      }
      emptyState={{
        icon: search ? SearchX : PackageX,
        title: t("margins_empty"),
      }}
      labels={{
        previous: t("previous"),
        next: t("next"),
        paginationTotal: (count) => t("stock_count", { count }),
        paginationProgress: (count, total) => t("stock_progress", { count, total }),
      }}
    />
  )
}
