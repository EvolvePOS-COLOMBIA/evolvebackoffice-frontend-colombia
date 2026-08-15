export interface LocaleConfig {
  locale: string
  currency: string
  dateOptions: Intl.DateTimeFormatOptions
  dateTimeOptions: Intl.DateTimeFormatOptions
}

const LOCALE_PRESETS: Record<"es" | "en", LocaleConfig> = {
  es: {
    locale: "es-CO",
    currency: "COP",
    dateOptions: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    dateTimeOptions: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  },
  en: {
    locale: "en-US",
    currency: "USD",
    dateOptions: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    dateTimeOptions: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  },
}

export function getLocaleConfig(lang: "es" | "en"): LocaleConfig {
  return LOCALE_PRESETS[lang]
}
