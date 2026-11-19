import { describe, expect, it } from "vitest"

import type { RouteNotification } from "../../types/api"
import { routeNotificationToast } from "../route-notification"

const base: RouteNotification = { status: "Sent", deliveryUserName: "Carlos Ruiz", ordersCount: 2, message: "ok" }

describe("routeNotificationToast", () => {
  it("returns null without a result", () => {
    expect(routeNotificationToast(null)).toBeNull()
    expect(routeNotificationToast(undefined)).toBeNull()
  })

  it("shows success with the courier name when the route was sent", () => {
    expect(routeNotificationToast(base)).toEqual({
      tone: "success",
      key: "route_sent",
      params: { name: "Carlos Ruiz", count: 2 },
    })
  })

  it("stays silent when WhatsApp is not enabled (Skipped without message)", () => {
    expect(routeNotificationToast({ ...base, status: "Skipped", message: null })).toBeNull()
  })

  it("warns when the order has no courier (Skipped with message)", () => {
    expect(routeNotificationToast({ ...base, status: "Skipped", message: "sin domiciliario" })?.key).toBe(
      "route_no_courier"
    )
  })

  it("maps the failures to their own messages", () => {
    expect(routeNotificationToast({ ...base, status: "NoPhone" })).toMatchObject({
      tone: "info",
      key: "route_no_phone",
    })
    expect(routeNotificationToast({ ...base, status: "NotConnected" })).toMatchObject({
      tone: "info",
      key: "route_not_connected",
    })
    expect(routeNotificationToast({ ...base, status: "Failed" })).toMatchObject({ tone: "error", key: "route_failed" })
  })
})
