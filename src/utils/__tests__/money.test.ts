import { describe, expect, it } from "vitest"

import {
  formatMoneyInput,
  formatMoneyValue,
  getCurrencyDecimals,
  getCurrencySymbol,
  getMoneySeparators,
  parseMoneyInput,
  parsePastedMoney,
} from "../money"

const CO = { locale: "es-CO", decimals: 0 }
const CO2 = { locale: "es-CO", decimals: 2 }
const US2 = { locale: "en-US", decimals: 2 }

describe("getMoneySeparators", () => {
  it("reads the separators from the locale", () => {
    expect(getMoneySeparators("es-CO")).toEqual({ group: ".", decimal: "," })
    expect(getMoneySeparators("en-US")).toEqual({ group: ",", decimal: "." })
  })
})

describe("getCurrencyDecimals", () => {
  it("uses the decimals the currency formats with", () => {
    expect(getCurrencyDecimals("es-CO", "COP")).toBe(0)
    expect(getCurrencyDecimals("en-US", "USD")).toBe(2)
  })
})

describe("getCurrencySymbol", () => {
  it("returns the symbol of the currency in the locale", () => {
    expect(getCurrencySymbol("es-CO", "COP")).toBe("$")
    expect(getCurrencySymbol("en-US", "USD")).toBe("$")
    expect(getCurrencySymbol("en-US", "EUR")).toBe("€")
  })
})

describe("formatMoneyInput (text typed by the user)", () => {
  it("groups thousands while typing", () => {
    expect(formatMoneyInput("1", CO)).toBe("1")
    expect(formatMoneyInput("1234", CO)).toBe("1.234")
    expect(formatMoneyInput("1234567", CO)).toBe("1.234.567")
    expect(formatMoneyInput("1234567", US2)).toBe("1,234,567")
  })

  it("keeps re-formatting stable when the group separator is typed back in", () => {
    expect(formatMoneyInput("1.2345", CO)).toBe("12.345")
    expect(formatMoneyInput("1.234", CO)).toBe("1.234")
  })

  it("keeps the decimal separator and the decimals as they are typed", () => {
    expect(formatMoneyInput("1234,", CO2)).toBe("1.234,")
    expect(formatMoneyInput("1234,5", CO2)).toBe("1.234,5")
    expect(formatMoneyInput("1234,50", CO2)).toBe("1.234,50")
    expect(formatMoneyInput("1234.5", US2)).toBe("1,234.5")
  })

  it("cuts the decimals to the allowed amount", () => {
    expect(formatMoneyInput("1,239", { locale: "es-CO", decimals: 2 })).toBe("1,23")
  })

  it("ignores the decimal separator when the currency has no decimals", () => {
    // Typed key by key: the comma is swallowed, so the next digit just continues the integer.
    expect(formatMoneyInput("1.234,", CO)).toBe("1.234")
    expect(formatMoneyInput("1.234", CO)).toBe("1.234")
  })

  it("drops anything that is not a digit or the decimal separator", () => {
    expect(formatMoneyInput("$ 12ab34", CO)).toBe("1.234")
    expect(formatMoneyInput("-5", CO)).toBe("5")
  })

  it("removes leading zeros but keeps a lone zero and a zero before the decimals", () => {
    expect(formatMoneyInput("007", CO)).toBe("7")
    expect(formatMoneyInput("0", CO)).toBe("0")
    expect(formatMoneyInput(",5", CO2)).toBe("0,5")
    expect(formatMoneyInput("0,5", CO2)).toBe("0,5")
  })

  it("returns an empty string for empty or non-numeric text", () => {
    expect(formatMoneyInput("", CO)).toBe("")
    expect(formatMoneyInput("abc", CO)).toBe("")
  })

  it("accepts only one decimal separator", () => {
    expect(formatMoneyInput("1,2,3", CO2)).toBe("1,23")
  })
})

describe("parseMoneyInput (formatted text → number)", () => {
  it("returns a plain number, with a dot decimal and no separators", () => {
    expect(parseMoneyInput("1.234.567", CO)).toBe(1234567)
    expect(parseMoneyInput("1.234,5", CO2)).toBe(1234.5)
    expect(parseMoneyInput("1,234.56", US2)).toBe(1234.56)
    expect(parseMoneyInput("0,5", CO2)).toBe(0.5)
  })

  it("returns null when there is nothing to parse", () => {
    expect(parseMoneyInput("", CO)).toBeNull()
    expect(parseMoneyInput("abc", CO)).toBeNull()
  })

  it("treats a dangling decimal separator as the integer", () => {
    expect(parseMoneyInput("1.234,", CO2)).toBe(1234)
  })

  it("keeps a typed zero as 0, not null", () => {
    expect(parseMoneyInput("0", CO)).toBe(0)
  })
})

describe("parsePastedMoney (text from outside, either format)", () => {
  it("reads es-style text", () => {
    expect(parsePastedMoney("1.234.567", CO)).toBe(1234567)
    expect(parsePastedMoney("$ 1.234,56", CO2)).toBe(1234.56)
  })

  it("reads en-style text even when the app is in es", () => {
    expect(parsePastedMoney("1,234.56", CO2)).toBe(1234.56)
    expect(parsePastedMoney("1,234,567", CO)).toBe(1234567)
  })

  it("reads a plain decimal", () => {
    expect(parsePastedMoney("1234.5", CO2)).toBe(1234.5)
    expect(parsePastedMoney("1234,5", CO2)).toBe(1234.5)
  })

  it("treats a single separator followed by three digits as a thousands group", () => {
    expect(parsePastedMoney("1.234", CO2)).toBe(1234)
    expect(parsePastedMoney("1,234", US2)).toBe(1234)
  })

  it("drops the decimals when the currency has none", () => {
    expect(parsePastedMoney("1234.56", CO)).toBe(1234)
  })

  it("returns null for text without digits", () => {
    expect(parsePastedMoney("abc", CO)).toBeNull()
    expect(parsePastedMoney("", CO)).toBeNull()
  })
})

describe("formatMoneyValue (number from the form → text)", () => {
  it("formats numbers and numeric strings", () => {
    expect(formatMoneyValue(1234567, CO)).toBe("1.234.567")
    expect(formatMoneyValue("1234567", CO)).toBe("1.234.567")
    expect(formatMoneyValue(1234.5, CO2)).toBe("1.234,5")
    expect(formatMoneyValue(1234.5, US2)).toBe("1,234.5")
  })

  it("shows an empty string for null, undefined and empty", () => {
    expect(formatMoneyValue(null, CO)).toBe("")
    expect(formatMoneyValue(undefined, CO)).toBe("")
    expect(formatMoneyValue("", CO)).toBe("")
  })

  it("shows zero", () => {
    expect(formatMoneyValue(0, CO)).toBe("0")
  })

  it("shows an empty string for values that are not a finite number", () => {
    expect(formatMoneyValue(Number.NaN, CO)).toBe("")
    expect(formatMoneyValue("abc", CO)).toBe("")
  })

  it("never shows more decimals than allowed", () => {
    expect(formatMoneyValue(1234.567, CO2)).toBe("1.234,57")
    expect(formatMoneyValue(1234.9, CO)).toBe("1.235")
  })
})
