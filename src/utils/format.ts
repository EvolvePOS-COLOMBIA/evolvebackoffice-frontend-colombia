import { getLocaleConfig } from "@/config/locale"
import { useAppStore } from "@/store/app-store"

function getLocale(lang?: string): string {
  if (lang) return lang
  const state = useAppStore.getState()
  return getLocaleConfig(state.locale).locale
}

export function formatCurrency(value: number, options?: { locale?: string; currency?: string }): string {
  const locale = options?.locale ?? getLocale()
  const currency = options?.currency ?? getLocaleConfig(useAppStore.getState().locale).currency

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, options?: { locale?: string }): string {
  const locale = options?.locale ?? getLocale()
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(date: Date | string, options?: { locale?: string }): string {
  const locale = options?.locale ?? getLocale()
  const config = getLocaleConfig(useAppStore.getState().locale)
  return new Intl.DateTimeFormat(locale, config.dateOptions).format(new Date(date))
}

export function formatDateTime(date: Date | string, options?: { locale?: string }): string {
  const locale = options?.locale ?? getLocale()
  const config = getLocaleConfig(useAppStore.getState().locale)
  return new Intl.DateTimeFormat(locale, config.dateTimeOptions).format(new Date(date))
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`
}
