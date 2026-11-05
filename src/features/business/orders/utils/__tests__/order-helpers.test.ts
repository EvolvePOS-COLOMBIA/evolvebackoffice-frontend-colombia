import { describe, expect, it } from "vitest"

import { getApiErrorMessage, mapsUrl, minutesSince } from "@/features/business/orders/utils/order-helpers"

describe("order-helpers", () => {
  it("getApiErrorMessage prioriza message, luego error y luego el genérico", () => {
    expect(getApiErrorMessage({ response: { data: { message: "m" } } })).toBe("m")
    expect(getApiErrorMessage({ response: { data: { error: "e" } } })).toBe("e")
    expect(getApiErrorMessage(new Error("x"), "fallback")).toBe("fallback")
  })

  it("mapsUrl usa coordenadas si existen", () => {
    const url = mapsUrl({
      shippingLatitude: 4.6,
      shippingLongitude: -74.08,
      shippingStreet: "Calle 1",
      shippingCity: null,
    })
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=4.6,-74.08")
  })

  it("mapsUrl cae a la dirección en texto y null sin datos", () => {
    expect(
      mapsUrl({
        shippingLatitude: null,
        shippingLongitude: null,
        shippingStreet: "Calle 1 # 2-3",
        shippingCity: "Bogotá",
      })
    ).toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Calle 1 # 2-3, Bogotá")}`)
    expect(mapsUrl({ shippingLatitude: null, shippingLongitude: null, shippingStreet: null, shippingCity: null })).toBe(
      null
    )
  })

  it("minutesSince calcula minutos enteros y nunca negativos", () => {
    const now = Date.parse("2026-10-07T12:30:00Z")
    expect(minutesSince("2026-10-07T12:00:00Z", now)).toBe(30)
    expect(minutesSince("2026-10-07T13:00:00Z", now)).toBe(0)
    expect(minutesSince(null, now)).toBeNull()
  })
})
