import { describe, expect, it } from "vitest"

import { branchValuesToPayload } from "../branch-payload"
import { BRANCH_TIME_ZONES, timeZoneOptions } from "../time-zones"

const values = {
  name: "Sede",
  identification: "",
  address: "",
  phone: "",
  email: "",
  latitude: "",
  longitude: "",
  adminUserId: "",
  isSupplier: false,
}

describe("timeZoneOptions", () => {
  it("offers the usual zones, Colombia first", () => {
    expect(timeZoneOptions()[0]).toBe("America/Bogota")
    expect(timeZoneOptions("America/Lima")).toEqual(BRANCH_TIME_ZONES)
  })

  it("keeps a zone that is not in the usual list so it still shows as selected", () => {
    expect(timeZoneOptions("Asia/Tokyo")[0]).toBe("Asia/Tokyo")
    expect(timeZoneOptions("Asia/Tokyo")).toHaveLength(BRANCH_TIME_ZONES.length + 1)
  })
})

describe("branchValuesToPayload and the time zone", () => {
  it("sends the zone when one is chosen", () => {
    expect(branchValuesToPayload({ ...values, timeZoneId: "America/Bogota" }).timeZoneId).toBe("America/Bogota")
  })

  it("leaves it out when the branch has none, so the create dialog is unchanged", () => {
    expect(branchValuesToPayload(values)).not.toHaveProperty("timeZoneId", expect.anything())
    expect(branchValuesToPayload({ ...values, timeZoneId: "" }).timeZoneId).toBeUndefined()
  })
})
