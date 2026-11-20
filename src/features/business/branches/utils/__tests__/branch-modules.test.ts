import { describe, expect, it } from "vitest"

import type { BranchModuleResponseDto, TenantModuleResponseDto } from "../../types/modules"
import { getAssignableTenantModules, getBranchScopedAssignments, isTenantModuleAssigned } from "../branch-modules"

function tm(code: string, overrides: Partial<TenantModuleResponseDto> = {}): TenantModuleResponseDto {
  return {
    id: `tm-${code}`,
    moduleId: `m-${code}`,
    moduleCode: code,
    moduleName: code,
    moduleDescription: null,
    isEnabled: true,
    quantity: null,
    ...overrides,
  }
}

function bm(code: string, overrides: Partial<BranchModuleResponseDto> = {}): BranchModuleResponseDto {
  return {
    id: `bm-${code}`,
    branchPublicId: "b1",
    branchName: "Sede",
    tenantModuleId: 1,
    tenantModulePublicId: `tm-${code}`,
    moduleCode: code,
    moduleName: code,
    isEnabled: true,
    createdAt: "2026-11-19T00:00:00Z",
    ...overrides,
  }
}

describe("getAssignableTenantModules", () => {
  it("deja solo los módulos por sucursal habilitados", () => {
    const list = [
      tm("DOMICILIOS", { isBranchScoped: true }),
      tm("IA", { isBranchScoped: false }),
      tm("CREDITO", { isBranchScoped: false }),
      tm("FIDELIZACION", { isBranchScoped: false }),
      tm("MESAS", { isBranchScoped: true, isEnabled: false }),
      tm("ORDERS", { isBranchScoped: true }),
    ]
    expect(getAssignableTenantModules(list).map((m) => m.moduleCode)).toEqual(["DOMICILIOS", "ORDERS"])
  })

  it("respeta el flag del backend sobre la lista de respaldo", () => {
    expect(getAssignableTenantModules([tm("NUEVO", { isBranchScoped: true })])).toHaveLength(1)
    expect(getAssignableTenantModules([tm("MESAS", { isBranchScoped: false })])).toHaveLength(0)
  })

  it("sin flag usa la lista de respaldo por código", () => {
    const list = [tm("PRODUCCION"), tm("IA"), tm("CREDITO"), tm("CLUVI"), tm("DESCONOCIDO")]
    expect(getAssignableTenantModules(list).map((m) => m.moduleCode)).toEqual(["PRODUCCION", "CLUVI"])
  })
})

describe("getBranchScopedAssignments", () => {
  it("oculta asignaciones heredadas de módulos globales", () => {
    expect(getBranchScopedAssignments([bm("IA"), bm("ORDERS")]).map((m) => m.moduleCode)).toEqual(["ORDERS"])
  })
})

describe("isTenantModuleAssigned", () => {
  it("cruza por tenantModulePublicId", () => {
    expect(isTenantModuleAssigned(tm("ORDERS"), [bm("ORDERS")])).toBe(true)
    expect(isTenantModuleAssigned(tm("MESAS"), [bm("ORDERS")])).toBe(false)
  })

  it("sin tenantModulePublicId cae al código", () => {
    expect(isTenantModuleAssigned(tm("ORDERS"), [bm("ORDERS", { tenantModulePublicId: undefined })])).toBe(true)
  })
})
