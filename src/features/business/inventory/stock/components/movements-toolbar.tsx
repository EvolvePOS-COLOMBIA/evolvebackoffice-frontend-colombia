import { Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { MOVEMENT_TYPES } from "../../types"
import { ALL, countHiddenMovementFilters, type MovementFilterForm } from "./movement-filter-form"
import { MovementFiltersContent } from "./movement-filters"

type MovementsToolbarProps = {
  branchId: string
  value: MovementFilterForm
  onChange: (value: MovementFilterForm) => void
}

/** Barra de herramientas del historial: búsqueda, tipo de movimiento y popover de filtros. */
export function MovementsToolbar({ branchId, value, onChange }: MovementsToolbarProps) {
  const { t } = useTranslation("business-inventory")
  const hiddenCount = countHiddenMovementFilters(value)

  return (
    <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-xl flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder={t("search_products")}
          className="h-8 pl-9 sm:h-9"
        />
      </div>
      <div className="flex w-fit max-w-full shrink-0 items-center gap-2">
        <Select value={value.type} onValueChange={(type) => onChange({ ...value, type })}>
          <SelectTrigger className="h-8 w-full sm:h-9 sm:w-60" aria-label={t("movement")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filter_all_movements")}</SelectItem>
            {MOVEMENT_TYPES.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`movement_${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          <PopoverContent align="end" className="w-[min(92vw,34rem)] p-4">
            <MovementFiltersContent branchId={branchId} value={value} onChange={onChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
