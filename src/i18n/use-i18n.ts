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
  | "business-items-departments"
  | "business-items-taxes"
  | "business-items-modifiers"
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
  const [isLoaded, setIsLoaded] = useState(ns === "common")

  useEffect(() => {
    // Cargar el namespace si no es "common"
    if (ns !== "common") {
      loadFeatureNamespace(ns).then(() => {
        setIsLoaded(true)
      })
    }
  }, [ns])

  // Mientras no esté cargado, usar la función t original de i18next
  // que ya tiene el correcto y solo devolverá la clave
  if (!isLoaded) {
    return {
      ...translation,
      ready: false,
    }
  }

  return translation
}
