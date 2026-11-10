import { useEffect, useRef, useState } from "react"
import type { TransitionEvent } from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

/** leading-6 (1.5rem = 24px) — una línea exacta de text-sm. */
const COLLAPSED_MAX_HEIGHT = 24
const MOBILE_QUERY = "(max-width: 639px)" // por debajo del breakpoint sm

type MobileDescriptionState = {
  isMobile: boolean
  expanded: boolean
  setExpanded: (value: boolean) => void
  clamped: boolean
  setClamped: (value: boolean) => void
  maxHeight: number | undefined
  setMaxHeight: (value: number | undefined) => void
}

/**
 * Estado del texto expandible acoplado al breakpoint móvil: el valor inicial se
 * lee de matchMedia (sin flash del estado equivocado) y el listener del propio
 * media query reinicia todo al cruzar el breakpoint (evento, no setState en
 * efecto — respeta react-hooks/set-state-in-effect).
 */
function useMobileDescriptionState(): MobileDescriptionState {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches
  )
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(true)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(COLLAPSED_MAX_HEIGHT)

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const onChange = () => {
      const mobile = query.matches
      setIsMobile(mobile)
      setExpanded(false)
      setClamped(mobile)
      setMaxHeight(mobile ? COLLAPSED_MAX_HEIGHT : undefined)
    }
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return {
    isMobile,
    expanded,
    setExpanded,
    clamped,
    setClamped,
    maxHeight,
    setMaxHeight,
  }
}

export type ExpandableDescriptionProps = {
  text: string
  className?: string
}

/**
 * Descripción del hero que en móvil se limita a UNA línea con "…" y se expande
 * con una animación de altura al tocarla (vuelve a colapsar con otro toque).
 * En `sm:` o superior se muestra siempre completa y sin interacción.
 *
 * La animación mide `scrollHeight` real al expandir (sin adivinar max-h) y
 * re-aplica `line-clamp-1` recién al terminar la transición de colapso, para
 * que los "…" aparezcan sin cortar la animación.
 */
export function ExpandableDescription({ text, className }: ExpandableDescriptionProps) {
  const { isMobile, expanded, setExpanded, clamped, setClamped, maxHeight, setMaxHeight } = useMobileDescriptionState()
  const contentRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const el = contentRef.current
    if (!el) return

    if (!expanded) {
      // Sin clamp, medir el alto real completo y animar hasta él.
      flushSync(() => setClamped(false))
      setMaxHeight(el.scrollHeight)
      setExpanded(true)
    } else {
      setExpanded(false)
      setMaxHeight(COLLAPSED_MAX_HEIGHT)
      // Sin transición (prefers-reduced-motion) no llega transitionend.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setClamped(true)
      }
    }
  }

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "max-height") return
    if (!expanded) setClamped(true)
  }

  return (
    <div
      ref={contentRef}
      style={isMobile && maxHeight !== undefined ? { maxHeight: `${maxHeight}px` } : undefined}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        "max-w-2xl",
        isMobile &&
          "cursor-pointer overflow-hidden transition-[max-height] duration-300 ease-in-out motion-reduce:transition-none",
        className
      )}
    >
      {isMobile ? (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          className="block w-full appearance-none bg-transparent p-0 text-left"
        >
          <span className={cn("text-sm leading-6 text-muted-foreground", clamped && "line-clamp-1 block")}>{text}</span>
        </button>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      )}
    </div>
  )
}
