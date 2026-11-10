import { useCallback, useRef, useState } from "react"

export type GeolocationErrorCode = "unsupported" | "permission_denied" | "unavailable" | "timeout"

export type GeolocationOutcome =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; code: GeolocationErrorCode }

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

/** Traduce los códigos del navegador a los nuestros; el resto se trata como no disponible. */
function mapErrorCode(error: GeolocationPositionError): GeolocationErrorCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "permission_denied"
    case error.POSITION_UNAVAILABLE:
      return "unavailable"
    case error.TIMEOUT:
      return "timeout"
    default:
      return "unavailable"
  }
}

export function useGeolocation() {
  const [isLocating, setIsLocating] = useState(false)
  const pendingRef = useRef<Promise<GeolocationOutcome> | null>(null)

  const requestLocation = useCallback((): Promise<GeolocationOutcome> => {
    // Si ya hay una petición en vuelo se reutiliza: nunca dos prompts a la vez.
    if (pendingRef.current) return pendingRef.current

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return Promise.resolve({ ok: false, code: "unsupported" })
    }

    const request = new Promise<GeolocationOutcome>((resolve) => {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ ok: true, latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => resolve({ ok: false, code: mapErrorCode(error) }),
        GEO_OPTIONS
      )
    })

    const tracked = request.finally(() => {
      pendingRef.current = null
      setIsLocating(false)
    })

    pendingRef.current = tracked
    return tracked
  }, [])

  return { isLocating, requestLocation }
}
