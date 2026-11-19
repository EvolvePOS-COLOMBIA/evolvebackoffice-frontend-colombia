import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, ClipboardEvent, FocusEvent } from "react"

import { useLocaleFormat } from "@/hooks/use-locale-format"
import {
  formatMoneyInput,
  formatMoneyValue,
  getCurrencyDecimals,
  getMoneySeparators,
  parseMoneyInput,
  parsePastedMoney,
} from "@/utils/money"

type Emit = "number" | "string"
type Emitted<E extends Emit> = E extends "string" ? string : number | null

export interface UseMoneyInputOptions<E extends Emit = "number"> {
  /**
   * Value held by the form. Numbers and numeric strings (dot decimal) are read; anything else
   * (null, undefined, "", unknown from a coerced schema) shows as empty.
   */
  value: unknown
  /**
   * Receives the plain amount: a `number` (null when empty) by default, or a dot-decimal
   * `string` ("" when empty) with `emit: "string"`. Never the formatted text.
   */
  onChange?: (value: Emitted<E>) => void
  emit?: E
  /** Highest amount accepted; bigger values are clamped. */
  max?: number
  /** Decimals accepted. Defaults to those of the locale currency (COP → 0). */
  decimals?: number
  /** Defaults to the app locale. */
  locale?: string
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

interface View {
  text: string
  /** Caret to restore after the next render; null leaves it alone. */
  caret: number | null
}

function normalize(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/** Index in `text` right after the n-th digit/decimal separator. */
function caretAfter(text: string, significant: number, decimal: string): number {
  if (significant <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i]) || text[i] === decimal) seen++
    if (seen === significant) return i + 1
  }
  return text.length
}

/**
 * Live-formatted money field. The form keeps a plain amount; this hook owns only the text shown
 * while the user types, so formatting never leaks into the data that is loaded or sent.
 *
 * Spread `inputProps` on an `<input>` (or use `MoneyInput`).
 */
export function useMoneyInput<E extends Emit = "number">({
  value,
  onChange,
  emit,
  max,
  decimals,
  locale,
  onBlur,
}: UseMoneyInputOptions<E>) {
  const app = useLocaleFormat()
  const resolvedLocale = locale ?? app.locale
  const resolvedDecimals = decimals ?? getCurrencyDecimals(resolvedLocale, app.currency)
  const options = useMemo(
    () => ({ locale: resolvedLocale, decimals: resolvedDecimals }),
    [resolvedLocale, resolvedDecimals]
  )

  const external = normalize(value)
  const [view, setView] = useState<View>(() => ({ text: formatMoneyValue(external, options), caret: null }))
  const [synced, setSynced] = useState({ external, options })

  // Adopt a value (or locale) that changed from outside, unless it is what the user just typed.
  if (synced.external !== external || synced.options !== options) {
    setSynced({ external, options })
    if (synced.options !== options || external !== parseMoneyInput(view.text, options)) {
      setView({ text: formatMoneyValue(external, options), caret: null })
    }
  }

  const ref = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    const input = ref.current
    if (view.caret === null || !input || document.activeElement !== input) return
    input.setSelectionRange(view.caret, view.caret)
  }, [view])

  const emitValue = (amount: number | null) => {
    if (amount === external) return
    const out = emit === "string" ? (amount === null ? "" : String(amount)) : amount
    onChange?.(out as Emitted<E>)
  }

  const clamp = (amount: number | null) => (amount !== null && max !== undefined && amount > max ? max : amount)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const caret = event.target.selectionStart ?? raw.length
    const { decimal } = getMoneySeparators(options.locale)
    const significant = [...raw.slice(0, caret)].filter(
      (c) => /\d/.test(c) || (c === decimal && options.decimals > 0)
    ).length

    let amount = parseMoneyInput(formatMoneyInput(raw, options), options)
    let text = formatMoneyInput(raw, options)
    const clamped = clamp(amount)
    if (clamped !== amount) {
      amount = clamped
      text = formatMoneyValue(clamped, options)
    }

    setView({ text, caret: caretAfter(text, significant, decimal) })
    emitValue(amount)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const amount = clamp(parsePastedMoney(event.clipboardData.getData("text"), options))
    if (amount === null) return
    setView({ text: formatMoneyValue(amount, options), caret: null })
    emitValue(amount)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setView({ text: formatMoneyValue(parseMoneyInput(view.text, options), options), caret: null })
    onBlur?.(event)
  }

  return {
    inputProps: {
      ref,
      type: "text" as const,
      inputMode: options.decimals > 0 ? ("decimal" as const) : ("numeric" as const),
      autoComplete: "off",
      value: view.text,
      onChange: handleChange,
      onPaste: handlePaste,
      onBlur: handleBlur,
    },
  }
}
