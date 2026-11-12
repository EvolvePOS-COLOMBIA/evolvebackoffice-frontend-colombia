import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, SearchX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useMovements, useVoidAdjustment } from "../../hooks/use-inventory"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { InventoryMovementDto } from "../../types"
import {
  EMPTY_MOVEMENT_FILTERS,
  hasMovementFilters,
  toMovementFilters,
  type MovementFilterForm,
} from "./movement-filter-form"
import { MovementsToolbar } from "./movements-toolbar"
import { buildMovementColumns } from "./movements-columns"

type MovementsTableProps = {
  branchId: string
  itemId?: string
}

/** Historial de movimientos (kardex) de la sucursal, opcionalmente de un producto. */
export function MovementsTable({ branchId, itemId }: MovementsTableProps) {
  const { t, i18n } = useTranslation("business-inventory")
  const [page, setPage] = useState(1)
  const [toVoid, setToVoid] = useState<InventoryMovementDto | null>(null)
  const [form, setForm] = useState<MovementFilterForm>(EMPTY_MOVEMENT_FILTERS)
  const [applied, setApplied] = useState<MovementFilterForm>(EMPTY_MOVEMENT_FILTERS)

  // Espera a que el usuario deje de escribir para no consultar en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setApplied(form), 350)
    return () => clearTimeout(timer)
  }, [form])

  const filters = useMemo(() => toMovementFilters(applied), [applied])
  const { data, isLoading } = useMovements({ branchId, itemId, pageNumber: page, ...filters })
  const voidAdjustment = useVoidAdjustment()

  // Cualquier cambio de filtro vuelve a la página 1.
  const filter = JSON.stringify([branchId, itemId ?? "", filters])
  const [prevFilter, setPrevFilter] = useState(filter)
  if (filter !== prevFilter) {
    setPrevFilter(filter)
    setPage(1)
  }

  const movements = data?.items ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" })

  const handleVoid = () => {
    if (!toVoid) return
    voidAdjustment.mutate(toVoid.documentId, {
      onSuccess: (doc) => {
        notify.success(t("void_done", { number: doc.number }))
        setToVoid(null)
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
    })
  }

  const filtered = hasMovementFilters(applied)

  return (
    <>
      <DataTable
        columns={buildMovementColumns(t, dateFormat, { onVoid: setToVoid })}
        data={movements}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalCount={data?.totalCount ?? 0}
        onPageChange={setPage}
        skeletonRows={5}
        minWidth="min-w-[820px]"
        toolbar={<MovementsToolbar branchId={branchId} value={form} onChange={setForm} />}
        emptyState={{
          icon: filtered ? SearchX : ArrowLeftRight,
          title: filtered ? t("no_movements_filtered") : t("no_movements"),
        }}
        labels={{
          previous: t("previous"),
          next: t("next"),
          paginationTotal: (count) => t("movements_count", { count }),
          paginationProgress: (count, total) => t("movements_progress", { count, total }),
        }}
      />

      <ConfirmActionDialog
        open={toVoid !== null}
        onOpenChange={(open) => {
          if (!open) setToVoid(null)
        }}
        title={t("void_title", { number: toVoid?.documentNumber ?? "" })}
        description={t("void_desc")}
        confirmLabel={t("void")}
        tone="destructive"
        isPending={voidAdjustment.isPending}
        onConfirm={handleVoid}
      />
    </>
  )
}
