import { SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// DialogTitle/DialogDescription son los primitivos de Radix: los SheetTitle/
// SheetDescription son divs simples y NO satisfacen la verificación de
// accesibilidad de Radix (consola: "DialogContent requires a DialogTitle").
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { useTranslation } from "@/i18n/use-i18n"
import {
  EMPTY_MOVEMENT_FILTERS,
  countHiddenMovementFilters,
  hasMovementFilters,
  type MovementFilterForm,
} from "./movement-filter-form"
import { MovementFiltersContent } from "./movement-filters"

type MovementFiltersSheetProps = {
  branchId: string
  value: MovementFilterForm
  onChange: (value: MovementFilterForm) => void
}

/**
 * Filtros del historial en panel lateral: header fijo, cuerpo scrolleable y
 * footer con limpiar/cerrar. Mide la altura completa de la ventana, así que
 * nunca se desborda sin importar cuántos filtros haya.
 */
export function MovementFiltersSheet({ branchId, value, onChange }: MovementFiltersSheetProps) {
  const { t } = useTranslation("business-inventory")
  const hiddenCount = countHiddenMovementFilters(value)

  return (
    <Sheet>
      <SheetTrigger asChild>
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
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(96vw,34rem)] p-0">
        <SheetHeader className="border-b border-border/70 pr-14 pb-4">
          <DialogTitle>{t("filters_title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("filters_desc")}</DialogDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <MovementFiltersContent branchId={branchId} value={value} onChange={onChange} />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 px-5 py-3">
          {hasMovementFilters(value) ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(EMPTY_MOVEMENT_FILTERS)}>
              <X className="size-4" />
              {t("filter_clear")}
            </Button>
          ) : null}
          <SheetClose asChild>
            <Button type="button" variant="outline" size="sm">
              {t("filters_close")}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
