import { describe, expect, it } from "vitest"

import type { BranchModuleResponseDto, ModuleUsage, TenantModuleResponseDto } from "../../types/modules"
import { computeModuleUsage, licenseState, moduleUsageKey, usageFromTenantModules } from "../module-usage"

function tm(code: string, overrides: Partial<TenantModuleResponseDto> = {}): TenantModuleResponseDto {
  return {
    id: `tm-${code}`,
    moduleId: `m-${code}`,
    moduleCode: code,
    moduleName: code,
    moduleDescription: null,
    isEnabled: true,
    quantity: 3,
    isBranchScoped: true,
    ...overrides,
  }
}

function bm(code: string, branch: string, overrides: Partial<BranchModuleResponseDto> = {}): BranchModuleResponseDto {
  return {
    id: `bm-${code}-${branch}`,
    branchPublicId: branch,
    branchName: `Sede ${branch}`,
    tenantModuleId: 1,
    tenantModulePublicId: `tm-${code}`,
    moduleCode: code,
    moduleName: code,
    isEnabled: true,
    createdAt: "2026-11-19T00:00:00Z",
    ...overrides,
  }
}

describe("moduleUsageKey", () => {
  it("prefers the public id and falls back to the code", () => {
    expect(moduleUsageKey({ id: "abc", moduleCode: "MESAS" })).toBe("abc")
    expect(moduleUsageKey({ id: "", moduleCode: "MESAS" })).toBe("MESAS")
  })
})

describe("computeModuleUsage", () => {
  it("counts only enabled assignments, by branch", () => {
    const usage = computeModuleUsage([tm("MESAS")], {
      a: [bm("MESAS", "a")],
      b: [bm("MESAS", "b", { isEnabled: false })],
      c: [bm("MESAS", "c")],
    })
    expect(usage["tm-MESAS"].quantity).toBe(3)
    expect(usage["tm-MESAS"].used).toBe(2)
    expect(usage["tm-MESAS"].assignedBranches).toEqual([
      { branchPublicId: "a", branchName: "Sede a" },
      { branchPublicId: "c", branchName: "Sede c" },
    ])
  })

  it("matches by code when the assignment has no tenantModulePublicId", () => {
    const usage = computeModuleUsage([tm("MESAS")], {
      a: [bm("MESAS", "a", { tenantModulePublicId: undefined })],
    })
    expect(usage["tm-MESAS"].used).toBe(1)
  })

  it("ignores global modules and does not double count a branch", () => {
    const usage = computeModuleUsage([tm("IA", { isBranchScoped: false }), tm("MESAS")], {
      a: [bm("IA", "a"), bm("MESAS", "a"), bm("MESAS", "a")],
    })
    expect(usage["tm-IA"]).toBeUndefined()
    expect(usage["tm-MESAS"].used).toBe(1)
  })

  it("returns zero usage for modules nobody has", () => {
    expect(computeModuleUsage([tm("MESAS")], {})["tm-MESAS"].used).toBe(0)
  })
})

describe("usageFromTenantModules", () => {
  it("uses assignedBranches when the backend sends it", () => {
    const usage = usageFromTenantModules([
      tm("MESAS", { assignedBranches: [{ branchPublicId: "a", branchName: "Norte" }] }),
    ])
    expect(usage?.["tm-MESAS"].used).toBe(1)
    expect(usage?.["tm-MESAS"].assignedBranches).toEqual([{ branchPublicId: "a", branchName: "Norte" }])
  })

  it("uses assignedCount when only the count is sent", () => {
    const usage = usageFromTenantModules([tm("MESAS", { assignedCount: 2 })])
    expect(usage?.["tm-MESAS"].used).toBe(2)
    expect(usage?.["tm-MESAS"].assignedBranches).toEqual([])
  })

  it("returns null when a branch-scoped module lacks the field", () => {
    expect(usageFromTenantModules([tm("MESAS")])).toBeNull()
    expect(usageFromTenantModules([tm("MESAS", { assignedCount: 1 }), tm("PRODUCCION")])).toBeNull()
  })

  it("ignores global modules when deciding", () => {
    const usage = usageFromTenantModules([tm("IA", { isBranchScoped: false }), tm("MESAS", { assignedCount: 0 })])
    expect(usage).not.toBeNull()
  })
})

describe("licenseState", () => {
  const usage = (quantity: number | null, used: number): ModuleUsage => ({
    quantity,
    used,
    assignedBranches: [],
  })

  it("reports free licenses", () => {
    expect(licenseState(usage(3, 1), false)).toEqual({
      used: 1,
      total: 3,
      free: 2,
      unlimited: false,
      exhausted: false,
      canEnable: true,
    })
  })

  it("blocks enabling when exhausted and the branch does not have it", () => {
    const state = licenseState(usage(2, 2), false)
    expect(state.exhausted).toBe(true)
    expect(state.free).toBe(0)
    expect(state.canEnable).toBe(false)
  })

  it("lets a branch that already has it turn it off", () => {
    expect(licenseState(usage(2, 2), true).canEnable).toBe(true)
  })

  it("treats null or non-positive quantity as unlimited", () => {
    for (const q of [null, 0, -1]) {
      const state = licenseState(usage(q, 5), false)
      expect(state.unlimited).toBe(true)
      expect(state.total).toBeNull()
      expect(state.free).toBeNull()
      expect(state.exhausted).toBe(false)
      expect(state.canEnable).toBe(true)
    }
  })

  it("never reports negative free licenses", () => {
    expect(licenseState(usage(1, 3), false).free).toBe(0)
  })

  it("does not block when usage is unknown", () => {
    expect(licenseState(undefined, false).canEnable).toBe(true)
  })
})
