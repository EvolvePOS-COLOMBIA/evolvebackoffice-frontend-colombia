import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"

export type SelectionAction = {
  label: string
  icon?: LucideIcon
  /** Variante del botón (default = acción principal destacada). */
  variant?: ComponentProps<typeof Button>["variant"]
  onClick: () => void
  disabled?: boolean
}

export type SelectionActionBarProps = {
  /** Cantidad de elementos seleccionados. Con 0 la barra no se renderiza. */
  count: number
  /** Texto descriptivo del tipo de elemento seleccionado (p. ej. "pedidos en «Listo»"). */
  label: string
  /** Acciones disponibles; la última con variante "default" queda destacada a la derecha. */
  actions: SelectionAction[]
  onClear: () => void
  className?: string
}

/**
 * Barra flotante inferior para modos de selección múltiple: contador de elementos
 * seleccionados, acciones y "limpiar selección". Se ancla abajo al centro para no
 * tapar el contenido de listas y tableros.
 *
 * **Usos posibles:**
 * - Barra «Asignar domiciliario (N)» del kanban de órdenes (asignación de varios
 *   pedidos a un domiciliario al pasarlos a "En camino").
 * - Acciones por lote en el catálogo de artículos (el multi-select de
 *   `global-catalog-view` puede migrarse a esta barra).
 * - Operaciones bulk en existencias/inventario (dar de baja, ajustar, transferir
 *   los artículos seleccionados).
 * - Cualquier lista futura con acciones masivas (personas, proveedores, turnos).
 *
 * La barra es agnóstica del dominio: el texto del contador, las acciones y sus
 * handlers los aporta quien la usa. Internamente solo traduce el botón
 * "limpiar selección" (namespace `common`, clave `clear_selection`).
 */
export function SelectionActionBar({ count, label, actions, onClear, className }: SelectionActionBarProps) {
  const { t } = useTranslation()

  if (count <= 0) return null

  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.25)] backdrop-blur-sm",
        className
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {count}
        </span>
        <span className="truncate text-sm text-muted-foreground">{label}</span>
      </span>

      <span className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={action.variant ?? "outline"}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {Icon ? <Icon className="mr-1.5 size-4" /> : null}
              {action.label}
            </Button>
          )
        })}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          title={t("clear_selection")}
          onClick={onClear}
        >
          <X className="size-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">{t("clear_selection")}</span>
        </Button>
      </span>
    </div>
  )
}
