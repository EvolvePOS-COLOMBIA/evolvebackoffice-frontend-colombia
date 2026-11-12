import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Search } from "lucide-react"

import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"

export type PickerOption = {
  /** Identificador devuelto al confirmar. */
  value: string
  label: string
  description?: string | null
  /** Chip opcional a la derecha (estado, sucursal, cantidad…). */
  badge?: { label: string; tone?: BadgeTone } | null
  icon?: LucideIcon
  disabled?: boolean
}

export type OptionPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  options: PickerOption[]
  loading?: boolean
  /** Mensaje cuando no hay opciones (o el filtro no encuentra nada). */
  emptyMessage?: string
  searchPlaceholder?: string
  confirmLabel: string
  onConfirm: (value: string) => void
  isPending?: boolean
  /** Contenido opcional bajo la lista (notas, resumen, avisos). */
  children?: React.ReactNode
}

/**
 * Diálogo genérico para elegir **una** opción de un catálogo: lista con
 * icono/descripción/badge por opción, búsqueda, estados de carga/vacío y
 * confirmación. La selección es tipo radio (una sola opción resaltada).
 *
 * **Usos posibles:**
 * - Asignar un domiciliario activo a uno o varios pedidos
 *   (`features/business/delivery/components/assign-delivery-user-dialog.tsx`).
 * - Elegir responsable/supervisor en workflows de aprobación o reparto de tareas.
 * - Seleccionar el motivo de una baja, anulación o devolución desde un catálogo.
 * - Elegir proveedor, sucursal destino o transportista en operaciones rápidas.
 * - Cualquier flujo "elegir uno de N" que hoy se resuelve con un `Select` largo
 *   pero necesita descripciones, badges o búsqueda cómoda.
 *
 * Agnóstico del dominio: las opciones y los textos los aporta quien lo usa; solo
 * traduce el placeholder de búsqueda por defecto (namespace `common`).
 */
export function OptionPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  loading = false,
  emptyMessage,
  searchPlaceholder,
  confirmLabel,
  onConfirm,
  isPending = false,
  children,
}: OptionPickerDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Nueva apertura = selección y búsqueda limpias. Ajuste durante el render
  // (mismo patrón que user-form-dialog), en vez de setState en un efecto.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setSelected(null)
      setQuery("")
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || (opt.description ?? "").toLowerCase().includes(q)
    )
  }, [options, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {options.length > 6 && (
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? t("search_placeholder")}
              className="pl-9"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage ?? t("no_results")}</p>
          ) : (
            filtered.map((opt) => {
              const Icon = opt.icon
              const isSelected = selected === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => setSelected(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background/45 hover:border-primary/20"
                  )}
                >
                  {Icon ? (
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{opt.label}</p>
                    {opt.description ? (
                      <p className="truncate text-xs text-muted-foreground">{opt.description}</p>
                    ) : null}
                  </div>
                  {opt.badge ? (
                    <Badge tone={opt.badge.tone ?? "neutral"} className="shrink-0 text-[10px]">
                      {opt.badge.label}
                    </Badge>
                  ) : null}
                </button>
              )
            })
          )}
        </div>

        {children}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={!selected || isPending} onClick={() => selected && onConfirm(selected)}>
            {isPending ? t("saving") : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
