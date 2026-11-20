import { describe, expect, it } from "vitest"

import type { SerialCodeSummaryDto } from "@/features/business/registers/types"
import {
  filterSerials,
  registerStatusTone,
  summarizeSerials,
  serialStatusKey,
  serialStatusTone,
} from "../register-status"

const serial = (over: Partial<SerialCodeSummaryDto>): SerialCodeSummaryDto => ({
  id: "1",
  serialCode: "ABC-123",
  status: "Unassigned",
  isAssignedToRegister: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
})

describe("register-status", () => {
  it("maps register status to tone", () => {
    expect(registerStatusTone("Active")).toBe("success")
    expect(registerStatusTone("Locked")).toBe("danger")
    expect(registerStatusTone("Maintenance")).toBe("warning")
    expect(registerStatusTone("Inactive")).toBe("neutral")
  })

  it("maps serial status to tone and key", () => {
    expect(serialStatusTone("Activated")).toBe("success")
    expect(serialStatusTone("Unassigned")).toBe("warning")
    expect(serialStatusKey("Decommissioned")).toBe("serial_status_decommissioned")
  })

  it("summarizes serials: assigned counts as in use, decommissioned is ignored", () => {
    const list = [
      serial({ id: "1" }),
      serial({ id: "2", isAssignedToRegister: true }),
      serial({ id: "3", status: "Activated", isAssignedToRegister: true }),
      serial({ id: "4", status: "Decommissioned" }),
    ]
    expect(summarizeSerials(list)).toEqual({ available: 1, inUse: 2 })
  })

  it("filters serials by code, device and register", () => {
    const list = [
      serial({ id: "1", serialCode: "AAA-1" }),
      serial({ id: "2", serialCode: "BBB-2", deviceName: "Desktop Caja" }),
      serial({ id: "3", serialCode: "CCC-3", registerName: "Principal" }),
    ]
    expect(filterSerials(list, "")).toHaveLength(3)
    expect(filterSerials(list, "bbb").map((s) => s.id)).toEqual(["2"])
    expect(filterSerials(list, "caja").map((s) => s.id)).toEqual(["2"])
    expect(filterSerials(list, " principal ").map((s) => s.id)).toEqual(["3"])
    expect(filterSerials(list, "zzz")).toEqual([])
  })
})
