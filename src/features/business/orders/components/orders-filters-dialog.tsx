import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/i18n/use-i18n"

/** Orden de apresentación de las órdenes dentro de cada columna. */
export type OrdersSortOrder = "recent" | "oldest"

type OrdersFiltersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  showCancelled: boolean
  onShowCancelledChange: (value: boolean) => void
  sortOrder: OrdersSortOrder
  onSortOrderChange: (value: OrdersSortOrder) => void
  /** Restablece todos los filtros a sus valores por defecto. */
  onClear: () => void
}

/**
 * Modal de filtros de Órdenes: mostrar/ocultar canceladas y ordenar por
 * más recientes o más antiguas. Los cambios se aplican de forma inmediata.
 */
export function OrdersFiltersDialog({
  open,
  onOpenChange,
  showCancelled,
  onShowCancelledChange,
  sortOrder,
  onSortOrderChange,
  onClear,
}: OrdersFiltersDialogProps) {
  const { t } = useTranslation("business-orders")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,26rem)]">
        <DialogHeader>
          <DialogTitle>{t("filters")}</DialogTitle>
          <DialogDescription>{t("filters_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Órdenes canceladas */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("show_cancelled")}</p>
              <p className="text-xs text-muted-foreground">{t("show_cancelled_desc")}</p>
            </div>
            <Switch checked={showCancelled} onCheckedChange={onShowCancelledChange} aria-label={t("show_cancelled")} />
          </div>

          <Separator />

          {/* Orden */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("sort_by")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={sortOrder === "recent" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-1.5"
                onClick={() => onSortOrderChange("recent")}
                aria-pressed={sortOrder === "recent"}
              >
                <ArrowDownWideNarrow className="size-3.5" />
                {t("sort_newest")}
              </Button>
              <Button
                variant={sortOrder === "oldest" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-1.5"
                onClick={() => onSortOrderChange("oldest")}
                aria-pressed={sortOrder === "oldest"}
              >
                <ArrowUpWideNarrow className="size-3.5" />
                {t("sort_oldest")}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 border-t border-border/70 pt-4 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t("clear_filters")}
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
