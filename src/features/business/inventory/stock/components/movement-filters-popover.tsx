import { SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "@/i18n/use-i18n"
import {
  EMPTY_MOVEMENT_FILTERS,
  countHiddenMovementFilters,
  hasMovementFilters,
  type MovementFilterForm,
} from "./movement-filter-form"
import { MovementFiltersContent } from "./movement-filters"

type MovementFiltersPopoverProps = {
  branchId: string
  value: MovementFilterForm
  onChange: (value: MovementFilterForm) => void
}

/**
 * Filtros del historial en popover ancho: grilla de 3 columnas con los rangos
 * en celda individual (12 celdas = 4 filas), altura máxima con scroll interno
 * y footer de limpiar siempre al alcance. La altura máxima es una red de
 * seguridad: en pantallas bajas hace scroll en vez de salirse del viewport.
 */
export function MovementFiltersPopover({ branchId, value, onChange }: MovementFiltersPopoverProps) {
  const { t } = useTranslation("business-inventory")
  const hiddenCount = countHiddenMovementFilters(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="max-sm:h-8 max-sm:px-2.5 max-sm:text-xs"
          aria-label={t("filters_title")}
        >
          <SlidersHorizontal className="size-4" />
          {t("filters_title")}
          {hiddenCount > 0 ? <Badge tone="primary">{hiddenCount}</Badge> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={t("filters_title")} className="w-[min(94vw,46rem)] overflow-hidden p-0">
        <div className="flex max-h-[min(70vh,32rem)] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <MovementFiltersContent dense branchId={branchId} value={value} onChange={onChange} />
          </div>

          {hasMovementFilters(value) ? (
            <div className="flex shrink-0 items-center justify-end border-t border-border/70 px-4 py-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(EMPTY_MOVEMENT_FILTERS)}>
                <X className="size-4" />
                {t("filter_clear")}
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
