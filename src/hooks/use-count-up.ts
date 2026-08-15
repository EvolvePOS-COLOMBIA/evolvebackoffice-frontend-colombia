import { useCallback, useEffect, useRef, useState } from "react"

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
  const format = useCallback(
    (v: number) => {
      if (formatter) return formatter(v)
      return `${prefix}${v.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`
    },
    [formatter, prefix, locale, decimals]
  )

  const [display, setDisplay] = useState(() => format(target))
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return

    startTimeRef.current = null

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target

      setDisplay(format(current))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, format])

  return display
}
