import { useState } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useMoneyInput } from "../use-money-input"

type Emitted = number | null | string

interface HarnessProps {
  initial?: number | string | null
  emit?: "number" | "string"
  max?: number
  locale?: string
  decimals?: number
  onValue?: (value: Emitted) => void
}

/** Controlled field the way a form would use it: it stores whatever the hook emits. */
function Harness({ initial = null, emit = "number", max, locale = "es-CO", decimals = 2, onValue }: HarnessProps) {
  const [value, setValue] = useState<Emitted>(initial)
  const { inputProps } = useMoneyInput({
    value,
    emit,
    max,
    locale,
    decimals,
    onChange: (next: Emitted) => {
      setValue(next)
      onValue?.(next)
    },
  } as Parameters<typeof useMoneyInput>[0])
  return (
    <div>
      <input aria-label="money" {...inputProps} />
      <output data-testid="stored">{JSON.stringify(value)}</output>
    </div>
  )
}

const field = () => screen.getByLabelText("money") as HTMLInputElement
const stored = () => screen.getByTestId("stored").textContent

/** Sets the text and the caret the way the browser does, bypassing React's value tracker. */
function typeText(input: HTMLInputElement, text: string, caret = text.length) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
  input.focus()
  setter.call(input, text)
  input.setSelectionRange(caret, caret)
  fireEvent.input(input)
}

describe("useMoneyInput", () => {
  it("shows the value it receives with thousands separators", () => {
    render(<Harness initial={1234567} decimals={0} />)
    expect(field().value).toBe("1.234.567")
  })

  it("shows an empty field for null", () => {
    render(<Harness initial={null} />)
    expect(field().value).toBe("")
  })

  it("groups while typing and emits a plain number", () => {
    render(<Harness decimals={0} />)
    typeText(field(), "1234567")
    expect(field().value).toBe("1.234.567")
    expect(stored()).toBe("1234567")
  })

  it("keeps a trailing decimal separator and the typed decimals", () => {
    render(<Harness />)
    typeText(field(), "1234,")
    expect(field().value).toBe("1.234,")
    expect(stored()).toBe("1234")
    typeText(field(), "1.234,50")
    expect(field().value).toBe("1.234,50")
    expect(stored()).toBe("1234.5")
  })

  it("emits null when the field is cleared", () => {
    render(<Harness initial={500} decimals={0} />)
    typeText(field(), "")
    expect(field().value).toBe("")
    expect(stored()).toBe("null")
  })

  it("emits 0 (not null) when the user types a zero", () => {
    render(<Harness decimals={0} />)
    typeText(field(), "0")
    expect(stored()).toBe("0")
  })

  it("rejects characters that are not digits", () => {
    render(<Harness decimals={0} />)
    typeText(field(), "12abc")
    expect(field().value).toBe("12")
    expect(stored()).toBe("12")
  })

  it("follows the value when the parent changes it (e.g. a form reset)", () => {
    function Controlled({ value }: { value: number | null }) {
      const { inputProps } = useMoneyInput({ value, onChange: () => {}, locale: "es-CO", decimals: 0 })
      return <input aria-label="money" {...inputProps} />
    }
    const { rerender } = render(<Controlled value={100} />)
    expect(field().value).toBe("100")
    rerender(<Controlled value={2500} />)
    expect(field().value).toBe("2.500")
    rerender(<Controlled value={null} />)
    expect(field().value).toBe("")
  })

  it("accepts a numeric string from the form and shows it formatted", () => {
    render(<Harness initial="25000" decimals={0} />)
    expect(field().value).toBe("25.000")
  })

  it("emits a dot-decimal string when asked to, and '' when empty", () => {
    render(<Harness emit="string" />)
    typeText(field(), "1.234,5")
    expect(stored()).toBe('"1234.5"')
    typeText(field(), "")
    expect(stored()).toBe('""')
  })

  it("clamps to max", () => {
    render(<Harness max={1000} decimals={0} />)
    typeText(field(), "5000")
    expect(field().value).toBe("1.000")
    expect(stored()).toBe("1000")
  })

  it("reads pasted text from another locale", () => {
    render(<Harness />)
    fireEvent.paste(field(), { clipboardData: { getData: () => "$ 1,234.56" } })
    expect(field().value).toBe("1.234,56")
    expect(stored()).toBe("1234.56")
  })

  it("ignores a paste that has no digits", () => {
    render(<Harness initial={10} decimals={0} />)
    fireEvent.paste(field(), { clipboardData: { getData: () => "abc" } })
    expect(field().value).toBe("10")
  })

  it("tidies the text on blur and calls the consumer's onBlur", () => {
    const onBlur = vi.fn()
    function WithBlur() {
      const [value, setValue] = useState<number | null>(null)
      const { inputProps } = useMoneyInput({ value, onChange: setValue, locale: "es-CO", decimals: 2, onBlur })
      return <input aria-label="money" {...inputProps} />
    }
    render(<WithBlur />)
    typeText(field(), "1234,")
    expect(field().value).toBe("1.234,")
    fireEvent.blur(field())
    expect(field().value).toBe("1.234")
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it("keeps the caret next to the digit being edited after regrouping", () => {
    render(<Harness decimals={0} initial={12345} />)
    // "12.345" → the user types a 9 right after the "1": "192.345", caret after the 9.
    typeText(field(), "192.345", 2)
    expect(field().value).toBe("192.345")
    expect(field().selectionStart).toBe(2)
    // Regrouping moves a separator: "1.2345" with the caret after the 4 → "12.345", caret after the 4.
    typeText(field(), "1.2345", 5)
    expect(field().value).toBe("12.345")
    expect(field().selectionStart).toBe(5)
  })

  it("reformats with the new locale when it changes while mounted", () => {
    const { rerender } = render(<Harness initial={1234.5} locale="es-CO" key="a" />)
    expect(field().value).toBe("1.234,5")
    act(() => {
      rerender(<Harness initial={1234.5} locale="en-US" key="a" />)
    })
    expect(field().value).toBe("1,234.5")
  })

  it("uses the numeric keyboard on mobile", () => {
    render(<Harness decimals={0} />)
    expect(field().getAttribute("inputmode")).toBe("numeric")
    expect(field().type).toBe("text")
  })

  it("uses the decimal keyboard when decimals are allowed", () => {
    render(<Harness decimals={2} />)
    expect(field().getAttribute("inputmode")).toBe("decimal")
  })
})
