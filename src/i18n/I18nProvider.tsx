import { useEffect, useState, useMemo } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./index"
import { I18nLoading } from "./I18nLoading"

// Componente para esperar la inicialización de i18n
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // useMemo para calcular si está inicializado
  // Esto evita el setState sincrónico en useEffect
  const isInitialized = useMemo(() => i18n.isInitialized, [])

  // Estado para disparar re-renders cuando el valor cambia
  // Solo se actualiza cuando el evento 'initialized' se dispara
  const [, setForceUpdate] = useState({})

  useEffect(() => {
    // Suscribirse al evento 'initialized' de i18n
    // Solo necesitamos esto si no está inicializado
    if (i18n.isInitialized) {
      return
    }

    const handleInitialized = () => {
      setForceUpdate({})
    }

    i18n.on("initialized", handleInitialized)

    // Cleanup listener
    return () => {
      i18n.off("initialized", handleInitialized)
    }
  }, [])

  // Usar el valor de useMemo para determinar si mostrar el componente
  if (!isInitialized) {
    return <I18nLoading />
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
