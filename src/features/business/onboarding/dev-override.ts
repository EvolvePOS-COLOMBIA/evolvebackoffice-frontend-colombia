/**
 * Override de desarrollo para forzar el onboarding.
 *
 * El gate normal decide por `forcePasswordChange` y por el conteo de sucursales,
 * así que un tenant que ya tiene sedes nunca lo vería. Esto permite probar el
 * flujo completo sin crear un tenant nuevo.
 *
 * Cómo se activa:
 *   · `?forceOnboarding=1` en la URL (queda guardado, no hace falta repetirlo)
 *   · `?forceOnboarding=0` para apagarlo
 *   · o directamente: localStorage.setItem("onboarding:force", "1")
 *
 * Solo funciona con `import.meta.env.DEV`: en un build de producción siempre
 * devuelve false, sin importar qué haya en localStorage o en la URL.
 */
const STORAGE_KEY = "onboarding:force"

function readStoredFlag(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Lee el query param una sola vez, al cargar el módulo, y lo persiste. Así el
 * override sobrevive a la redirección hacia `/business/onboarding`, que se lleva
 * los parámetros de la URL por delante.
 */
function syncFromUrl() {
  try {
    const param = new URLSearchParams(window.location.search).get("forceOnboarding")

    if (param === "1" || param === "true") {
      window.localStorage.setItem(STORAGE_KEY, "1")
      return
    }

    if (param === "0" || param === "false") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Modo privado o storage bloqueado: el override simplemente no aplica.
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  syncFromUrl()
}

export function isOnboardingForced(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false
  }

  return readStoredFlag()
}

/**
 * Se llama al terminar el wizard. Sin esto, el override seguiría activo y el
 * gate devolvería al usuario al onboarding en bucle al salir al panel.
 */
export function clearOnboardingForce() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada que limpiar si el storage no está disponible.
  }
}
