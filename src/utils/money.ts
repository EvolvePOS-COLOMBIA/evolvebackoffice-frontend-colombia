/**
 * Money input helpers: the single place that knows how a money amount is typed, shown and parsed.
 *
 * The value that leaves/enters a form is always a plain `number` (dot decimal, no separators).
 * The text shown in the field is derived from it with the separators of the locale.
 */

export interface MoneyFormatOptions {
  /** BCP-47 locale, e.g. "es-CO". */
  locale: string
  /** Maximum decimals accepted (0 for COP). */
  decimals: number
}

export interface MoneySeparators {
  group: string
  decimal: string
}

export function getMoneySeparators(locale: string): MoneySeparators {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.8)
  return {
    group: parts.find((p) => p.type === "group")?.value ?? ",",
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
  }
}

/** Decimals the currency is formatted with in the locale (COP → 0, USD → 2). */
export function getCurrencyDecimals(locale: string, currency: string): number {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/** Symbol of the currency in the locale ("$" for COP and USD). */
export function getCurrencySymbol(locale: string, currency: string): string {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  )
}

interface Amount {
  /** Integer digits, no leading zeros ("" when nothing was typed). */
  int: string
  /** Decimal digits; null when there is no decimal separator. */
  frac: string | null
}

function groupThousands(int: string, group: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, group)
}

function toAmount(int: string, frac: string | null, decimals: number): Amount {
  const cleanInt = int.replace(/^0+(?=\d)/, "")
  if (decimals <= 0) return { int: cleanInt, frac: null }
  return { int: cleanInt, frac: frac === null ? null : frac.slice(0, decimals) }
}

/** Reads the text of the field itself: only the locale decimal separator is a decimal. */
function readTyped(raw: string, { locale, decimals }: MoneyFormatOptions): Amount {
  const { decimal } = getMoneySeparators(locale)
  const at = raw.indexOf(decimal)
  const intPart = at === -1 ? raw : raw.slice(0, at)
  const fracPart = at === -1 ? null : raw.slice(at + decimal.length)
  return toAmount(intPart.replace(/\D/g, ""), fracPart === null ? null : fracPart.replace(/\D/g, ""), decimals)
}

function render({ int, frac }: Amount, { locale }: MoneyFormatOptions): string {
  const { group, decimal } = getMoneySeparators(locale)
  if (int === "" && frac === null) return ""
  const shownInt = int === "" ? "0" : groupThousands(int, group)
  return frac === null ? shownInt : `${shownInt}${decimal}${frac}`
}

function toNumber({ int, frac }: Amount): number | null {
  if (int === "" && !frac) return null
  return Number(`${int === "" ? "0" : int}${frac ? `.${frac}` : ""}`)
}

/** Text typed in the field → text to show (grouped, decimals kept as typed). */
export function formatMoneyInput(raw: string, options: MoneyFormatOptions): string {
  return render(readTyped(raw, options), options)
}

/** Formatted text of the field → number (null when empty). */
export function parseMoneyInput(text: string, options: MoneyFormatOptions): number | null {
  return toNumber(readTyped(text, options))
}

/**
 * Pasted text, which may come from another locale ("1,234.56" or "1.234,56"). The last separator
 * is the decimal one; a lone separator followed by exactly three digits is a thousands group.
 */
export function parsePastedMoney(text: string, options: MoneyFormatOptions): number | null {
  const cleaned = text.replace(/[^\d.,]/g, "")
  if (!/\d/.test(cleaned)) return null

  const lastDot = cleaned.lastIndexOf(".")
  const lastComma = cleaned.lastIndexOf(",")
  const last = Math.max(lastDot, lastComma)

  let intPart = cleaned
  let fracPart: string | null = null

  if (last !== -1) {
    const sep = cleaned[last]
    const after = cleaned.slice(last + 1)
    const otherSepPresent = cleaned.includes(sep === "." ? "," : ".")
    const isGroup = !otherSepPresent && after.length === 3
    if (!isGroup) {
      intPart = cleaned.slice(0, last)
      fracPart = after
    }
  }

  const amount = toAmount(
    intPart.replace(/\D/g, ""),
    fracPart === null ? null : fracPart.replace(/\D/g, ""),
    options.decimals
  )
  return toNumber(amount)
}

/** Number (or numeric string) coming from the form → text to show. */
export function formatMoneyValue(value: number | string | null | undefined, options: MoneyFormatOptions): string {
  if (value === null || value === undefined || value === "") return ""
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return ""
  const factor = 10 ** Math.max(0, options.decimals)
  const rounded = Math.round(Math.abs(num) * factor) / factor
  const [int, frac] = String(rounded).split(".")
  return render(toAmount(int, frac ?? null, options.decimals), options)
}
