import { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./index"
import { I18nLoading } from "./I18nLoading"

// Componente para esperar la inicialización de i18n
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(i18n.isInitialized)

  useEffect(() => {
    // Si ya está inicializado, no hacer nada
    if (i18n.isInitialized) {
      setIsInitialized(true)
      return
    }

    // Esperamos a que se inicialice (en casos donde init sea asíncrono)
    const handleInitialized = () => {
      setIsInitialized(true)
    }

    i18n.on("initialized", handleInitialized)

    // Cleanup listener
    return () => {
      i18n.off("initialized", handleInitialized)
    }
  }, [])

  // Mostrar loading mientras no está inicializado
  if (!isInitialized) {
    return <I18nLoading />
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
