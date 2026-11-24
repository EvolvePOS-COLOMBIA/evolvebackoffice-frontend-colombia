import { describe, expect, it } from "vitest"

import { formatWhatsAppNumber, isValidWhatsAppNumber, phoneDigits } from "../phone"

describe("whatsapp phone", () => {
  it("keeps only digits", () => {
    expect(phoneDigits("+57 (300) 123-4567")).toBe("573001234567")
  })

  it("accepts numbers with country code and common separators", () => {
    expect(isValidWhatsAppNumber("+57 300 123 4567")).toBe(true)
    expect(isValidWhatsAppNumber("(57) 300-123-4567")).toBe(true)
  })

  it("rejects empty, too short, too long or with letters", () => {
    expect(isValidWhatsAppNumber("")).toBe(false)
    expect(isValidWhatsAppNumber("1234567")).toBe(false)
    expect(isValidWhatsAppNumber("1234567890123456")).toBe(false)
    expect(isValidWhatsAppNumber("57300abc4567")).toBe(false)
  })

  it("formats with a leading plus", () => {
    expect(formatWhatsAppNumber("573001234567")).toBe("+573001234567")
    expect(formatWhatsAppNumber(null)).toBe("")
  })
})
