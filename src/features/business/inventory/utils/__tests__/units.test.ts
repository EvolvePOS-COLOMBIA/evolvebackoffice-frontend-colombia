import { afterEach, describe, expect, it } from "vitest"
import { useAppStore } from "@/store/app-store"
import {
  BASE_UNIT,
  BASE_UNIT_KEY,
  formatInPackaging,
  formatMoney,
  formatQuantity,
  inventoryUseOf,
  toBaseQuantity,
  unitSymbol,
} from "../units"

// Intl usa espacios especiales (NBSP / NNBSP) en algunos formatos.
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, " ")

describe("unitSymbol", () => {
  it("falls back to und for unknown units", () => {
    expect(unitSymbol(BASE_UNIT.gram)).toBe("g")
    expect(unitSymbol(99)).toBe("und")
  })
})

describe("formatQuantity", () => {
  it("shows large grams and milliliters as kg and L", () => {
    expect(formatQuantity(25000, BASE_UNIT.gram)).toBe("25 kg")
    expect(formatQuantity(1500, BASE_UNIT.milliliter)).toBe("1,5 L")
    expect(formatQuantity(-2000, BASE_UNIT.gram)).toBe("-2 kg")
  })

  it("keeps small amounts and units in the base unit", () => {
    expect(formatQuantity(750, BASE_UNIT.gram)).toBe("750 g")
    expect(formatQuantity(12, BASE_UNIT.unit)).toBe("12 und")
  })
})

describe("formatInPackaging", () => {
  it("shows the equivalent in the packaging", () => {
    expect(formatInPackaging(50000, { name: "Bulto 25 kg", factor: 25000 })).toBe("2 × Bulto 25 kg")
  })

  it("returns null without a usable packaging", () => {
    expect(formatInPackaging(10, null)).toBeNull()
    expect(formatInPackaging(10, { name: "Caja", factor: 0 })).toBeNull()
  })
})

describe("formatMoney", () => {
  afterEach(() => useAppStore.setState({ locale: "es" }))

  it("follows the app language", () => {
    useAppStore.setState({ locale: "es" })
    expect(plain(formatMoney(12500))).toBe("$ 12.500")
    useAppStore.setState({ locale: "en" })
    expect(formatMoney(12500)).toBe("$12,500")
  })
})

describe("inventoryUseOf", () => {
  it("maps the two switches to a use", () => {
    expect(inventoryUseOf(true, false)).toBe("ingredient")
    expect(inventoryUseOf(true, true)).toBe("resale")
    expect(inventoryUseOf(false, true)).toBe("menuDish")
    expect(inventoryUseOf(false, false)).toBe("internal")
  })
})

describe("toBaseQuantity", () => {
  const packagings = [{ id: "bulto", factor: 25000 }]

  it("converts packagings to the base unit", () => {
    expect(toBaseQuantity({ amount: "2", unitKey: "bulto" }, packagings)).toBe(50000)
    expect(toBaseQuantity({ amount: "300", unitKey: BASE_UNIT_KEY }, packagings)).toBe(300)
  })

  it("returns null for empty, invalid or unknown input", () => {
    expect(toBaseQuantity({ amount: " ", unitKey: BASE_UNIT_KEY }, packagings)).toBeNull()
    expect(toBaseQuantity({ amount: "abc", unitKey: BASE_UNIT_KEY }, packagings)).toBeNull()
    expect(toBaseQuantity({ amount: "1", unitKey: "caja" }, packagings)).toBeNull()
    expect(toBaseQuantity({ amount: "1e309", unitKey: BASE_UNIT_KEY }, packagings)).toBeNull()
  })
})
