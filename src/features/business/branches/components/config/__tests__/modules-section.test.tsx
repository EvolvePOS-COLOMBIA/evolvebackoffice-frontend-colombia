/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ModulesSection } from "../modules-section"

const state = vi.hoisted(() => ({ assign: vi.fn(), remove: vi.fn() }))

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}|${Object.values(options).join("|")}` : key,
    i18n: { language: "es" },
  }),
}))

// The tenant module id is a GUID and the branch module points at the tenant module with an
// internal integer, so the two lists can only be matched by module code.
vi.mock("@/features/business/branches/hooks/use-branch-modules", () => ({
  useTenantModules: () => ({
    data: [
      { id: "guid-orders", moduleCode: "ORDERS", moduleName: "Órdenes", moduleDescription: null, isEnabled: true },
      {
        id: "guid-dom",
        moduleCode: "DOMICILIOS",
        moduleName: "Domicilios",
        moduleDescription: "Pedidos",
        isEnabled: true,
      },
      { id: "guid-mesas", moduleCode: "MESAS", moduleName: "Mesas", moduleDescription: null, isEnabled: false },
    ],
    isLoading: false,
  }),
  useBranchModules: () => ({
    data: [{ id: "bm-orders", tenantModuleId: 16, moduleCode: "ORDERS", isEnabled: true }],
    isLoading: false,
  }),
  useAssignModuleToBranch: () => ({ mutate: state.assign, isPending: false }),
  useRemoveModuleFromBranch: () => ({ mutate: state.remove, isPending: false }),
}))

beforeEach(() => {
  state.assign.mockReset()
  state.remove.mockReset()
})

describe("ModulesSection", () => {
  it("marks as assigned the module the branch already has, matched by code", () => {
    render(<ModulesSection branchId="b1" />)
    expect(screen.getByRole("switch", { name: "Órdenes" })).toBeChecked()
    expect(screen.getByRole("switch", { name: "Domicilios" })).not.toBeChecked()
    expect(screen.getByText(/cfg_modules_active\|1/)).toBeInTheDocument()
  })

  it("assigns a module with the tenant module id", () => {
    render(<ModulesSection branchId="b1" />)
    fireEvent.click(screen.getByRole("switch", { name: "Domicilios" }))
    expect(state.assign.mock.calls[0][0]).toEqual({ branchId: "b1", tenantModulePublicId: "guid-dom" })
  })

  it("removes a module with the branch module id", () => {
    render(<ModulesSection branchId="b1" />)
    fireEvent.click(screen.getByRole("switch", { name: "Órdenes" }))
    expect(state.remove.mock.calls[0][0]).toEqual({ branchId: "b1", modulePublicId: "bm-orders" })
  })

  it("shows modules outside the license as not available", () => {
    render(<ModulesSection branchId="b1" />)
    expect(screen.getByText("cfg_module_no_license")).toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: "Mesas" })).toBeNull()
  })
})
