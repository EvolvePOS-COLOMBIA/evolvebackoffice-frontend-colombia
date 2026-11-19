import { describe, expect, it } from "vitest"

import es from "../../i18n/es.json"
import en from "../../i18n/en.json"
import { ORDER_STATUS_CONFIG } from "../index"

const ALL_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Shipped",
  "Delivered",
  "Cancelled",
  "NeedsReview",
  "Refunded",
]

describe("ORDER_STATUS_CONFIG", () => {
  it.each(ALL_STATUSES)("has a config for %s", (status) => {
    expect(ORDER_STATUS_CONFIG[status]).toBeDefined()
  })

  it.each(ALL_STATUSES)("points %s to a translated label in es and en", (status) => {
    const { labelKey } = ORDER_STATUS_CONFIG[status]

    expect((es as Record<string, string>)[labelKey]).toBeTruthy()
    expect((en as Record<string, string>)[labelKey]).toBeTruthy()
  })
})
