import { useSyncExternalStore } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./index"
import { I18nLoading } from "./I18nLoading"

function subscribeToInitialization(onStoreChange: () => void) {
  i18n.on("initialized", onStoreChange)

  return () => {
    i18n.off("initialized", onStoreChange)
  }
}

function getInitializationSnapshot() {
  return i18n.isInitialized
}

// Componente para esperar la inicialización de i18n
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const isInitialized = useSyncExternalStore(subscribeToInitialization, getInitializationSnapshot)

  // Mostrar loading mientras no está inicializado
  if (!isInitialized) {
    return <I18nLoading />
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
