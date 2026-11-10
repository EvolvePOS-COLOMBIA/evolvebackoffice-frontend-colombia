import { useEffect, useRef, useState } from "react"

interface UseCountUpOptions {
  duration?: number
  decimals?: number
  prefix?: string
  locale?: string
  formatter?: (value: number) => string
}

export function useCountUp(
  target: number,
  { duration = 1200, decimals = 0, prefix = "", locale, formatter }: UseCountUpOptions = {}
) {
  const [display, setDisplay] = useState(() =>
    formatter
      ? formatter(target)
      : `${prefix}${target.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  )
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)

  // Objetivo0: no hay animación que correr, pero el display SÍ debe
  // actualizarse. Sin esto, el valor se queda pegado en el último monto
  // no-cero (p. ej. al volver de "Mes" a "Semana" cuando ventas web es0).
  if (target === 0) {
    const zeroDisplay = formatter
      ? formatter(0)
      : `${prefix}${(0).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
    if (display !== zeroDisplay) {
      setDisplay(zeroDisplay)
    }
  }

  useEffect(() => {
    if (target === 0) return

    startTimeRef.current = null

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target

      // During animation: plain number with decimals. Final frame: apply formatter.
      if (progress >= 1) {
        setDisplay(
          formatter
            ? formatter(target)
            : `${prefix}${target.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
        )
      } else {
        setDisplay(
          `${prefix}${current.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
        )
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, formatter, prefix, locale, decimals])

  return display
}
