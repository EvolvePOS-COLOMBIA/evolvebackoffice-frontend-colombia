import { useEffect, useState } from "react"
import { useTranslation as useI18NextTranslation } from "react-i18next"
import { loadFeatureNamespace } from "./index"

export type Namespace =
  | "common"
  | "auth"
  | "platform-dashboard"
  | "platform-clients"
  | "platform-tenants"
  | "platform-email"
  | "platform-users"
  | "business-dashboard"
  | "business-items"
  | "business-items-catalog"
  | "business-inventory"
  | "business-onboarding"
  | "business-people"
  | "business-reports"
  | "business-registers"
  | "business-settings"
  | "business-branches-terminals"
  | "business-branches-config"
  | "business-users-catalog"
  | "marketing"

export function useTranslation(ns: Namespace = "common") {
  const translation = useI18NextTranslation(ns)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Cargar el namespace si no es "common"
    if (ns !== "common") {
      loadFeatureNamespace(ns).then(() => {
        setIsLoaded(true)
      })
    } else {
      // "common" ya está cargado en la inicialización
      setIsLoaded(true)
    }
  }, [ns])

  // Mientras no esté cargado, retornar un objeto con funciones seguras que devuelven la clave
  // Esto evita que se rendericen claves en la UI
  if (!isLoaded) {
    return {
      t: (key: string, options?: Record<string, unknown>): string => {
        // Devolver la clave con opciones si hay, o la clave tal cual
        if (options) {
          return key
        }
        return key
      },
      i18n: translation.i18n,
      ready: false,
    }
  }

  return translation
}
