import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import commonEs from "./locales/es/common.json"
import commonEn from "./locales/en/common.json"

import platformDashboardEs from "@/features/platform/dashboard/i18n/es.json"
import platformDashboardEn from "@/features/platform/dashboard/i18n/en.json"
import platformTenantsEs from "@/features/platform/tenants/i18n/es.json"
import platformTenantsEn from "@/features/platform/tenants/i18n/en.json"
import platformUsersEs from "@/features/platform/users/i18n/es.json"
import platformUsersEn from "@/features/platform/users/i18n/en.json"
import platformEmailEs from "@/features/platform/email/i18n/es.json"
import platformEmailEn from "@/features/platform/email/i18n/en.json"
import platformAiSettingsEs from "@/features/platform/ai-settings/i18n/es.json"
import platformAiSettingsEn from "@/features/platform/ai-settings/i18n/en.json"
import platformLogsEs from "@/features/platform/logs/i18n/es.json"
import platformLogsEn from "@/features/platform/logs/i18n/en.json"
import platformAuditEs from "@/features/platform/audit/i18n/es.json"
import platformAuditEn from "@/features/platform/audit/i18n/en.json"
import businessDashboardEs from "@/features/business/dashboard/i18n/es.json"
import businessDashboardEn from "@/features/business/dashboard/i18n/en.json"
import businessItemsEs from "@/features/business/items/i18n/es.json"
import businessItemsEn from "@/features/business/items/i18n/en.json"
import businessItemsCatalogEs from "@/features/business/items/catalog/i18n/es.json"
import businessItemsCatalogEn from "@/features/business/items/catalog/i18n/en.json"
import businessItemsDepartmentsEs from "@/features/business/items/departments/i18n/es.json"
import businessItemsDepartmentsEn from "@/features/business/items/departments/i18n/en.json"
import businessItemsTaxesEs from "@/features/business/items/taxes/i18n/es.json"
import businessItemsTaxesEn from "@/features/business/items/taxes/i18n/en.json"
import businessItemsModifiersEs from "@/features/business/items/modifiers/i18n/es.json"
import businessItemsModifiersEn from "@/features/business/items/modifiers/i18n/en.json"
import businessInventoryEs from "@/features/business/inventory/i18n/es.json"
import businessInventoryEn from "@/features/business/inventory/i18n/en.json"
import businessOnboardingEs from "@/features/business/onboarding/i18n/es.json"
import businessOnboardingEn from "@/features/business/onboarding/i18n/en.json"
import businessPeopleEs from "@/features/business/people/i18n/es.json"
import businessPeopleEn from "@/features/business/people/i18n/en.json"
import businessReportsEs from "@/features/business/reports/i18n/es.json"
import businessReportsEn from "@/features/business/reports/i18n/en.json"
import businessSettingsEs from "@/features/business/settings/i18n/es.json"
import businessSettingsEn from "@/features/business/settings/i18n/en.json"
import businessUsersCatalogEs from "@/features/business/people/users/i18n/es.json"
import businessUsersCatalogEn from "@/features/business/people/users/i18n/en.json"
import businessCustomersEs from "@/features/business/people/customers/i18n/es.json"
import businessCustomersEn from "@/features/business/people/customers/i18n/en.json"
import businessSuppliersEs from "@/features/business/inventory/suppliers/i18n/es.json"
import businessSuppliersEn from "@/features/business/inventory/suppliers/i18n/en.json"
import businessOrdersEs from "@/features/business/orders/i18n/es.json"
import businessOrdersEn from "@/features/business/orders/i18n/en.json"
import businessPaymentMethodsEs from "@/features/business/payment-methods/i18n/es.json"
import businessPaymentMethodsEn from "@/features/business/payment-methods/i18n/en.json"
import businessCreditEs from "@/features/business/people/credit/i18n/es.json"
import businessCreditEn from "@/features/business/people/credit/i18n/en.json"
import businessRegistersEs from "@/features/business/registers/i18n/es.json"
import businessRegistersEn from "@/features/business/registers/i18n/en.json"
import businessBranchesConfigEs from "@/features/business/branches/config/i18n/es.json"
import businessBranchesConfigEn from "@/features/business/branches/config/i18n/en.json"
import businessBranchesTerminalsEs from "@/features/business/branches/terminals/i18n/es.json"
import businessBranchesTerminalsEn from "@/features/business/branches/terminals/i18n/en.json"
import businessAiChatEs from "@/features/business/ai-chat/i18n/es.json"
import businessAiChatEn from "@/features/business/ai-chat/i18n/en.json"

const resources = {
  es: {
    common: commonEs,
    "platform-dashboard": platformDashboardEs,
    "platform-tenants": platformTenantsEs,
    "platform-users": platformUsersEs,
    "platform-email": platformEmailEs,
    "platform-ai-settings": platformAiSettingsEs,
    "platform-logs": platformLogsEs,
    "platform-audit": platformAuditEs,
    "business-dashboard": businessDashboardEs,
    "business-items": businessItemsEs,
    "business-items-catalog": businessItemsCatalogEs,
    "business-items-departments": businessItemsDepartmentsEs,
    "business-items-taxes": businessItemsTaxesEs,
    "business-items-modifiers": businessItemsModifiersEs,
    "business-inventory": businessInventoryEs,
    "business-onboarding": businessOnboardingEs,
    "business-people": businessPeopleEs,
    "business-reports": businessReportsEs,
    "business-settings": businessSettingsEs,
    "business-users-catalog": businessUsersCatalogEs,
    "business-customers": businessCustomersEs,
    "business-suppliers": businessSuppliersEs,
    "business-orders": businessOrdersEs,
    "business-payment-methods": businessPaymentMethodsEs,
    "business-credit": businessCreditEs,
    "business-registers": businessRegistersEs,
    "business-branches-config": businessBranchesConfigEs,
    "business-branches-terminals": businessBranchesTerminalsEs,
    "business-ai-chat": businessAiChatEs,
  },
  en: {
    common: commonEn,
    "platform-dashboard": platformDashboardEn,
    "platform-tenants": platformTenantsEn,
    "platform-users": platformUsersEn,
    "platform-email": platformEmailEn,
    "platform-ai-settings": platformAiSettingsEn,
    "platform-logs": platformLogsEn,
    "platform-audit": platformAuditEn,
    "business-dashboard": businessDashboardEn,
    "business-items": businessItemsEn,
    "business-items-catalog": businessItemsCatalogEn,
    "business-items-departments": businessItemsDepartmentsEn,
    "business-items-taxes": businessItemsTaxesEn,
    "business-items-modifiers": businessItemsModifiersEn,
    "business-inventory": businessInventoryEn,
    "business-onboarding": businessOnboardingEn,
    "business-people": businessPeopleEn,
    "business-reports": businessReportsEn,
    "business-settings": businessSettingsEn,
    "business-users-catalog": businessUsersCatalogEn,
    "business-customers": businessCustomersEn,
    "business-suppliers": businessSuppliersEn,
    "business-orders": businessOrdersEn,
    "business-payment-methods": businessPaymentMethodsEn,
    "business-credit": businessCreditEn,
    "business-registers": businessRegistersEn,
    "business-branches-config": businessBranchesConfigEn,
    "business-branches-terminals": businessBranchesTerminalsEn,
    "business-ai-chat": businessAiChatEn,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: "es",
  fallbackLng: "es",
  ns: [
    "common",
    "auth",
    "marketing",
    "platform-dashboard",
    "platform-tenants",
    "platform-users",
    "platform-email",
    "platform-ai-settings",
    "platform-logs",
    "platform-audit",
    "business-dashboard",
    "business-items",
    "business-items-catalog",
    "business-items-departments",
    "business-items-taxes",
    "business-items-modifiers",
    "business-inventory",
    "business-onboarding",
    "business-people",
    "business-reports",
    "business-settings",
    "business-users-catalog",
    "business-customers",
    "business-suppliers",
    "business-orders",
    "business-payment-methods",
    "business-credit",
    "business-registers",
    "business-branches-config",
    "business-branches-terminals",
    "business-ai-chat",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
})

// Carga perezosa de JSON de features. Se usa import.meta.glob (y no un
// import() con la ruta construida en runtime) porque Vite solo puede analizar
// estáticamente rutas con un nivel de variable: con dos (p. ej.
// business/registers) el dev server falla con "Unknown variable dynamic
// import" y la página queda mostrando las claves i18n crudas.
type FeatureI18nModule = { default: Record<string, string> }

const featureI18nEs = import.meta.glob<FeatureI18nModule>("../features/**/i18n/es.json")
const featureI18nEn = import.meta.glob<FeatureI18nModule>("../features/**/i18n/en.json")

export async function loadFeatureNamespace(featureNs: string) {
  const lng = i18n.language

  if (i18n.hasResourceBundle(lng, featureNs)) {
    return
  }

  const basePath = `../features/${featureNs.replace(/-/g, "/")}/i18n/`
  const loadEs = featureI18nEs[`${basePath}es.json`]
  const loadEn = featureI18nEn[`${basePath}en.json`]

  if (!loadEs || !loadEn) {
    console.error(`Failed to load namespace "${featureNs}": i18n files not found at ${basePath}`)
    return
  }

  try {
    const [esModule, enModule] = await Promise.all([loadEs(), loadEn()])

    i18n.addResourceBundle("es", featureNs, esModule.default, true, true)
    i18n.addResourceBundle("en", featureNs, enModule.default, true, true)
  } catch (error) {
    console.error(`Failed to load namespace "${featureNs}":`, error)
  }
}

export default i18n
