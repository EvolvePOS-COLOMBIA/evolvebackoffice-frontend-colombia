import { createRef } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { describe, expect, it, vi } from "vitest"

import { MoneyInput, MoneyInputBare } from "../money-input"
import { FIELD_SURFACE_CLASS } from "../field-surface"

function typeText(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
  input.focus()
  setter.call(input, text)
  input.setSelectionRange(text.length, text.length)
  fireEvent.input(input)
}

const schema = z.object({ price: z.coerce.number().min(0) })

function Form({ onSubmit, price = 1500 }: { onSubmit: (values: { price: number }) => void; price?: number }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { price } })
  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values as { price: number }))}>
      <Controller
        control={form.control}
        name="price"
        render={({ field }) => <MoneyInput aria-label="price" decimals={0} locale="es-CO" {...field} />}
      />
      <button type="submit">save</button>
    </form>
  )
}

describe("MoneyInput", () => {
  it("shows the form value formatted and submits a plain number", async () => {
    const onSubmit = vi.fn()
    render(<Form onSubmit={onSubmit} />)
    const input = screen.getByLabelText("price") as HTMLInputElement
    expect(input.value).toBe("1.500")

    typeText(input, "1234567")
    expect(input.value).toBe("1.234.567")

    fireEvent.click(screen.getByText("save"))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ price: 1234567 })
  })

  it("submits null-ish emptiness as a number the schema accepts (cleared field → 0 via coerce)", async () => {
    const onSubmit = vi.fn()
    render(<Form onSubmit={onSubmit} />)
    typeText(screen.getByLabelText("price") as HTMLInputElement, "")
    fireEvent.click(screen.getByText("save"))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ price: 0 })
  })

  it("forwards the ref (react-hook-form focuses it on error)", () => {
    const ref = createRef<HTMLInputElement>()
    render(<MoneyInput ref={ref} aria-label="price" value={10} onChange={() => {}} decimals={0} locale="es-CO" />)
    expect(ref.current).toBe(screen.getByLabelText("price"))
  })

  it("passes name, id, disabled and placeholder through", () => {
    render(
      <MoneyInput
        aria-label="price"
        name="price"
        id="price-field"
        disabled
        placeholder="0"
        value={null}
        onChange={() => {}}
        decimals={0}
        locale="es-CO"
      />
    )
    const input = screen.getByLabelText("price") as HTMLInputElement
    expect(input.name).toBe("price")
    expect(input.id).toBe("price-field")
    expect(input.disabled).toBe(true)
    expect(input.placeholder).toBe("0")
  })

  it("uses the shared field surface like every other input, on the box that holds the symbol", () => {
    render(<MoneyInput aria-label="price" value={null} onChange={() => {}} decimals={0} locale="es-CO" />)
    const box = screen.getByLabelText("price").closest("[data-slot=money-input]") as HTMLElement
    expect(box).not.toBeNull()
    for (const cls of FIELD_SURFACE_CLASS.split(" ")) {
      expect(box.className).toContain(cls)
    }
  })

  it("shows the currency symbol inside the field, hidden from assistive technology", () => {
    render(<MoneyInput aria-label="price" value={4500} onChange={() => {}} decimals={0} locale="es-CO" />)
    const box = screen.getByLabelText("price").closest("[data-slot=money-input]") as HTMLElement
    const symbol = box.querySelector("[aria-hidden=true]") as HTMLElement
    expect(symbol.textContent).toBe("$")
  })

  it("puts the className on the box, so callers can size the whole field", () => {
    render(
      <MoneyInput aria-label="price" className="w-28" value={null} onChange={() => {}} decimals={0} locale="es-CO" />
    )
    const input = screen.getByLabelText("price")
    expect(input.closest("[data-slot=money-input]")!.className).toContain("w-28")
    expect(input.className).not.toContain("w-28")
  })

  it("shows the symbol of the app currency", () => {
    render(<MoneyInput aria-label="price" value={1} onChange={() => {}} />)
    const box = screen.getByLabelText("price").closest("[data-slot=money-input]") as HTMLElement
    expect(box.querySelector("[aria-hidden=true]")!.textContent).toBe("$")
  })

  it("calls onBlur from the consumer", () => {
    const onBlur = vi.fn()
    render(<MoneyInput aria-label="price" value={1} onChange={() => {}} onBlur={onBlur} decimals={0} locale="es-CO" />)
    fireEvent.blur(screen.getByLabelText("price"))
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})

describe("MoneyInputBare", () => {
  it("renders a plain input with the same behavior, no field styling and no symbol", () => {
    const onChange = vi.fn()
    render(<MoneyInputBare aria-label="price" value={null} onChange={onChange} decimals={0} locale="es-CO" />)
    const input = screen.getByLabelText("price") as HTMLInputElement
    expect(input.getAttribute("data-slot")).toBeNull()
    expect(input.closest("[data-slot=money-input]")).toBeNull()
    typeText(input, "2500")
    expect(input.value).toBe("2.500")
    expect(onChange).toHaveBeenCalledWith(2500)
  })
})
