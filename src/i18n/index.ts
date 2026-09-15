import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import commonEs from "./locales/es/common.json"
import commonEn from "./locales/en/common.json"

import authEs from "@/features/auth/i18n/es.json"
import authEn from "@/features/auth/i18n/en.json"
import marketingEs from "@/features/marketing/i18n/es.json"
import marketingEn from "@/features/marketing/i18n/en.json"
import platformDashboardEs from "@/features/platform/dashboard/i18n/es.json"
import platformDashboardEn from "@/features/platform/dashboard/i18n/en.json"
import platformTenantsEs from "@/features/platform/tenants/i18n/es.json"
import platformTenantsEn from "@/features/platform/tenants/i18n/en.json"
import platformUsersEs from "@/features/platform/users/i18n/es.json"
import platformUsersEn from "@/features/platform/users/i18n/en.json"
import platformEmailEs from "@/features/platform/email/i18n/es.json"
import platformEmailEn from "@/features/platform/email/i18n/en.json"
import businessDashboardEs from "@/features/business/dashboard/i18n/es.json"
import businessDashboardEn from "@/features/business/dashboard/i18n/en.json"
import businessItemsEs from "@/features/business/items/i18n/es.json"
import businessItemsEn from "@/features/business/items/i18n/en.json"
import businessItemsCatalogEs from "@/features/business/items/catalog/i18n/es.json"
import businessItemsCatalogEn from "@/features/business/items/catalog/i18n/en.json"
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

const resources = {
  es: {
    common: commonEs,
    auth: authEs,
    marketing: marketingEs,
    "platform-dashboard": platformDashboardEs,
    "platform-tenants": platformTenantsEs,
    "platform-users": platformUsersEs,
    "platform-email": platformEmailEs,
    "business-dashboard": businessDashboardEs,
    "business-items": businessItemsEs,
    "business-items-catalog": businessItemsCatalogEs,
    "business-inventory": businessInventoryEs,
    "business-onboarding": businessOnboardingEs,
    "business-people": businessPeopleEs,
    "business-reports": businessReportsEs,
    "business-settings": businessSettingsEs,
    "business-users-catalog": businessUsersCatalogEs,
  },
  en: {
    common: commonEn,
    auth: authEn,
    marketing: marketingEn,
    "platform-dashboard": platformDashboardEn,
    "platform-tenants": platformTenantsEn,
    "platform-users": platformUsersEn,
    "platform-email": platformEmailEn,
    "business-dashboard": businessDashboardEn,
    "business-items": businessItemsEn,
    "business-items-catalog": businessItemsCatalogEn,
    "business-inventory": businessInventoryEn,
    "business-onboarding": businessOnboardingEn,
    "business-people": businessPeopleEn,
    "business-reports": businessReportsEn,
    "business-settings": businessSettingsEn,
    "business-users-catalog": businessUsersCatalogEn,
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
    "business-dashboard",
    "business-items",
    "business-items-catalog",
    "business-inventory",
    "business-onboarding",
    "business-people",
    "business-reports",
    "business-settings",
    "business-users-catalog",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
})

export async function loadFeatureNamespace(featureNs: string) {
  const lng = i18n.language

  if (i18n.hasResourceBundle(lng, featureNs)) {
    return
  }

  try {
    const [esModule, enModule] = await Promise.all([
      import(`@/features/${featureNs.replace(/-/g, "/")}/i18n/es.json`),
      import(`@/features/${featureNs.replace(/-/g, "/")}/i18n/en.json`),
    ])

    i18n.addResourceBundle("es", featureNs, esModule.default, true, true)
    i18n.addResourceBundle("en", featureNs, enModule.default, true, true)
  } catch (error) {
    console.error(`Failed to load namespace "${featureNs}":`, error)
  }
}

export default i18n
