import { describe, expect, it } from "vitest"
import type { ProductLine } from "../../components/product-lines-editor"
import { linesAreValid, toLineInputs } from "../lines"
import { BASE_UNIT, BASE_UNIT_KEY } from "../units"

const line = (amount: string, unitKey = BASE_UNIT_KEY, unitCost?: string): ProductLine => ({
  itemId: `item-${amount}-${unitKey}`,
  name: "Harina",
  sku: null,
  baseUnit: BASE_UNIT.gram,
  quantity: { amount, unitKey },
  unitCost,
})

describe("linesAreValid", () => {
  it("needs at least one line with quantity over 0", () => {
    expect(linesAreValid([])).toBe(false)
    expect(linesAreValid([line("0")])).toBe(false)
    expect(linesAreValid([line("2"), line("")])).toBe(false)
    expect(linesAreValid([line("2")])).toBe(true)
    expect(linesAreValid([line("1e309")])).toBe(false)
  })

  it("checks the price only when asked", () => {
    expect(linesAreValid([line("2")], true)).toBe(false)
    expect(linesAreValid([line("2", BASE_UNIT_KEY, " ")], true)).toBe(false)
    expect(linesAreValid([line("2", BASE_UNIT_KEY, "-1")], true)).toBe(false)
    expect(linesAreValid([line("2", BASE_UNIT_KEY, "0")], true)).toBe(true)
  })
})

describe("toLineInputs", () => {
  it("sends the packaging id, or null for the base unit", () => {
    expect(toLineInputs([line("3", "bulto"), line("250")])).toEqual([
      { itemId: "item-3-bulto", quantity: 3, packagingId: "bulto" },
      { itemId: `item-250-${BASE_UNIT_KEY}`, quantity: 250, packagingId: null },
    ])
  })
})
