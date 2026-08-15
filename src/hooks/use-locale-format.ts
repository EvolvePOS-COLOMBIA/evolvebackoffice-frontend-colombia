import { useCallback, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { getLocaleConfig } from "@/config/locale"

export function useLocaleFormat() {
  const locale = useAppStore((s) => s.locale)

  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale])
  const appLocale = localeConfig.locale
  const currency = localeConfig.currency

  const formatCurrencyFn = useCallback(
    (value: number, opts?: { currency?: string }) => {
      return new Intl.NumberFormat(appLocale, {
        style: "currency",
        currency: opts?.currency ?? currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    },
    [appLocale, currency]
  )

  const formatNumberFn = useCallback(
    (value: number) => {
      return new Intl.NumberFormat(appLocale).format(value)
    },
    [appLocale]
  )

  const formatDateFn = useCallback(
    (date: Date | string) => {
      return new Intl.DateTimeFormat(appLocale, localeConfig.dateOptions).format(new Date(date))
    },
    [appLocale, localeConfig.dateOptions]
  )

  const formatDateTimeFn = useCallback(
    (date: Date | string) => {
      return new Intl.DateTimeFormat(appLocale, localeConfig.dateTimeOptions).format(new Date(date))
    },
    [appLocale, localeConfig.dateTimeOptions]
  )

  return useMemo(
    () => ({
      locale: appLocale,
      currency,
      formatCurrency: formatCurrencyFn,
      formatNumber: formatNumberFn,
      formatDate: formatDateFn,
      formatDateTime: formatDateTimeFn,
    }),
    [appLocale, currency, formatCurrencyFn, formatNumberFn, formatDateFn, formatDateTimeFn]
  )
}
