import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type ExpandableTabOption = {
  value: string
  label: ReactNode
  /** Icono opcional a la izquierda del label. */
  icon?: ReactNode
  /** Elemento opcional a la derecha del label (p. ej. un badge con conteo). */
  badge?: ReactNode
}

type ExpandableTabsProps = {
  value: string
  onValueChange: (value: string) => void
  options: ExpandableTabOption[]
  className?: string
  /** Texto accesible del botón cuando está colapsado. */
  expandLabel?: string
  /** Texto accesible del botón cuando está expandido. */
  collapseLabel?: string
}

/**
 * Tabs colapsables: en reposo muestra solo el tab seleccionado junto a un
 * botón para expandir; al expandir muestra todas las opciones y, al elegir
 * una, vuelve a colapsar automáticamente.
 */
export function ExpandableTabs({
  value,
  onValueChange,
  options,
  className,
  expandLabel = "Expand options",
  collapseLabel = "Collapse options",
}: ExpandableTabsProps) {
  const [expanded, setExpanded] = useState(false)
  const selected = options.find((option) => option.value === value) ?? options[0]

  /** Selecciona una opción y colapsa el grupo. */
  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue)
    setExpanded(false)
  }

  const visibleOptions = expanded ? options : selected ? [selected] : []

  return (
    <Tabs value={value} onValueChange={handleSelect}>
      <TabsList className={cn("max-w-full flex-wrap items-center gap-1", className)}>
        {visibleOptions.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className={cn(
              "flex items-center justify-between gap-1",
              // Las opciones que entran al expandir aparecen con un fundido sutil.
              expanded && option.value !== value && "animate-in duration-150 fade-in-0 zoom-in-95"
            )}
          >
            {/* {option.icon} */}
            {option.label}
            {option.badge}
          </TabsTrigger>
        ))}

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? collapseLabel : expandLabel}
          title={expanded ? collapseLabel : expandLabel}
          className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-4 rotate-270 transition-transform duration-300 ease-out", expanded && "rotate-90")}
          />
        </button>
      </TabsList>
    </Tabs>
  )
}
