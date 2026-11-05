import { describe, expect, it } from "vitest"
import { whatsappDesktopUrl, whatsappPhone } from "../whatsapp-desktop"

describe("WhatsApp Desktop draft", () => {
  it.each(["+57 (300) 123-4567", "3001234567", "00573001234567"])("normalizes %s", (phone) =>
    expect(whatsappPhone(phone)).toBe("573001234567")
  )
  it.each(["javascript:alert(1)", "+57300&text=injected", "123", ""])("rejects %s", (phone) =>
    expect(whatsappDesktopUrl(phone, "hello")).toBeNull()
  )
  it("encodes the draft and targets the local Desktop protocol, not any API", () => {
    const url = whatsappDesktopUrl("+573001234567", "Hola Ana & José\n#pedido 1")!
    expect(url.startsWith("whatsapp://send?")).toBe(true)
    expect(new URL(url).searchParams.get("text")).toBe("Hola Ana & José\n#pedido 1")
    expect(new URL(url).searchParams.get("phone")).toBe("573001234567")
  })
})
