import * as React from "react"

import { FIELD_SURFACE_CLASS } from "@/components/ui/field-surface"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { cn } from "@/lib/utils"
import { getCurrencySymbol } from "@/utils/money"
import { useMoneyInput, type UseMoneyInputOptions } from "@/hooks/use-money-input"

type Emit = "number" | "string"

export type MoneyInputProps<E extends Emit = "number"> = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "inputMode"
> &
  Omit<UseMoneyInputOptions<E>, "onBlur">

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

function useMoneyField<E extends Emit>({
  value,
  onChange,
  emit,
  max,
  decimals,
  locale,
  onBlur,
  ref,
  ...rest
}: MoneyInputProps<E>) {
  const { inputProps } = useMoneyInput<E>({ value, onChange, emit, max, decimals, locale, onBlur })
  return { ...rest, ...inputProps, ref: mergeRefs(inputProps.ref, ref) }
}

/**
 * Money field with live thousands separators and the currency symbol inside the box. It reads
 * and emits plain amounts (see `useMoneyInput`), so it is a drop-in for `{...field}` in
 * react-hook-form or for local state. `className` sizes the whole box; every other prop goes to
 * the input.
 */
function MoneyInput<E extends Emit = "number">({ className, ...props }: MoneyInputProps<E>) {
  const { locale, currency } = useLocaleFormat()
  const symbol = getCurrencySymbol(props.locale ?? locale, currency)
  const inputProps = useMoneyField(props)
  return (
    <div
      data-slot="money-input"
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-2xl border border-border/70 px-4 text-sm text-foreground shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        FIELD_SURFACE_CLASS,
        className
      )}
    >
      <span aria-hidden className="text-muted-foreground">
        {symbol}
      </span>
      <input
        {...inputProps}
        className="w-full min-w-0 bg-transparent p-0 text-right tabular-nums outline-none placeholder:text-muted-foreground/90 disabled:cursor-not-allowed"
      />
    </div>
  )
}

/** Same behavior without the field styling or the symbol, for custom containers (table cells…). */
function MoneyInputBare<E extends Emit = "number">(props: MoneyInputProps<E>) {
  return <input {...useMoneyField(props)} />
}

export { MoneyInput, MoneyInputBare }
