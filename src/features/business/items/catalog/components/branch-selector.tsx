import { useLayoutEffect, useRef, useState } from "react"
import { Building2, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"

export type BranchSelectorOption = {
  id: string | null
  name: string
}

type BranchSelectorProps = {
  options: BranchSelectorOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  label?: string
}

/**
 * Selector de sucursales: pills en pantalla grande y `<select>` nativo en móvil.
 *
 * Además de por breakpoint, colapsa al select cuando las pills no caben en el
 * ancho que le queda al contenedor: se compara el ancho natural del contenido
 * (`scrollWidth`) contra el ancho real disponible, así degrada según el espacio
 * y no según el tamaño de pantalla.
 */
export function BranchSelector({ options, selectedId, onSelect, label }: BranchSelectorProps) {
  const { t } = useTranslation("business-items-catalog")
  const wrapRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLDivElement>(null)
  const [fits, setFits] = useState(true)

  // El llamador reconstruye `options` en cada render: se identifica por contenido.
  const optionsKey = options.map((option) => `${option.id ?? ""}:${option.name}`).join("|")

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const pills = pillsRef.current
    if (!wrap || !pills) return

    // Colapsadas, las pills miden 0 y `scrollWidth` sigue dando su ancho natural;
    // expandidas, `wrap` ya no ocupa todo el espacio, así que se mide contra él.
    const measure = () => setFits(pills.scrollWidth <= wrap.clientWidth + 1)
    measure()

    // El contenedor sigue reflejando el ancho disponible aunque las pills estén colapsadas.
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [optionsKey])

  return (
    <div ref={wrapRef} className={cn("relative max-w-full min-w-0", !fits && "w-full")}>
      <select
        aria-label={label ?? t("branch_selector")}
        value={selectedId ?? "__ALL__"}
        onChange={(event) => onSelect(event.target.value === "__ALL__" ? null : event.target.value)}
        className={cn("h-11 w-full min-w-0 rounded-xl border bg-background px-3 text-sm", fits && "sm:hidden")}
      >
        {options.map((option) => (
          <option key={option.id ?? "__ALL__"} value={option.id ?? "__ALL__"}>
            {option.name}
          </option>
        ))}
      </select>
      <div
        ref={pillsRef}
        className={cn(
          "items-center gap-1 rounded-lg border bg-muted p-1",
          fits
            ? "hidden max-w-full overflow-x-auto sm:flex"
            : // Modo medición: fuera de flujo, sin tamaño y ocultas. `visibility: hidden`
              // conserva el layout (a diferencia de `display: none`), así el ancho
              // natural sigue siendo medible y no se entra en bucle de colapso.
              "invisible absolute flex h-0 w-0 overflow-hidden border-0 p-0"
        )}
      >
        {options.map((option) => {
          const isSelected = option.id === selectedId
          const isGlobal = option.id === null

          return (
            <button
              key={option.id ?? "global"}
              onClick={() => onSelect(option.id)}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:min-h-8 ${
                isSelected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              } `}
            >
              {isGlobal ? <Globe className="size-3.5" /> : <Building2 className="size-3.5" />}
              <span>{option.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
