import { useEffect } from "react"
import { useTranslation as useI18NextTranslation } from "react-i18next"
import { loadFeatureNamespace } from "./index"

export type Namespace = "common" | "auth" | "platform-dashboard" | "platform-clients" | "business-dashboard" | "business-items" | "business-inventory" | "business-people" | "business-reports" | "business-settings" | "marketing"

export function useTranslation(ns: Namespace = "common") {
  const translation = useI18NextTranslation(ns)

  useEffect(() => {
    if (ns !== "common") {
      loadFeatureNamespace(ns)
    }
  }, [ns])

  return translation
}
