/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ModulesSection } from "../modules-section"

const state = vi.hoisted(() => ({
  assign: vi.fn(),
  remove: vi.fn(),
  usage: { data: undefined, isLoading: false, isError: false } as Record<string, unknown>,
}))

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
  useModuleUsage: () => state.usage,
  useAssignModuleToBranch: () => ({ mutate: state.assign, isPending: false }),
  useRemoveModuleFromBranch: () => ({ mutate: state.remove, isPending: false }),
}))

beforeEach(() => {
  state.assign.mockReset()
  state.remove.mockReset()
  state.usage = { data: undefined, isLoading: false, isError: false }
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

  it("hides modules outside the license", () => {
    render(<ModulesSection branchId="b1" />)
    expect(screen.queryByText("Mesas")).toBeNull()
  })

  describe("license usage", () => {
    const usage = {
      "guid-orders": { quantity: 1, used: 1, assignedBranches: [{ branchPublicId: "b1", branchName: "Norte" }] },
      "guid-dom": {
        quantity: 2,
        used: 2,
        assignedBranches: [
          { branchPublicId: "b2", branchName: "Sur" },
          { branchPublicId: "b3", branchName: "Centro" },
        ],
      },
    }

    it("disables a module without free licenses unless the branch already has it", () => {
      state.usage = { data: usage, isLoading: false, isError: false }
      render(<ModulesSection branchId="b1" />)
      expect(screen.getByRole("switch", { name: "Domicilios" })).toBeDisabled()
      expect(screen.getByRole("switch", { name: "Órdenes" })).toBeEnabled()
      expect(screen.getByText("cfg_modules_exhausted")).toBeInTheDocument()
      expect(screen.getByText("cfg_modules_in_use_at|Sur, Centro")).toBeInTheDocument()
    })

    it("keeps switches usable and shows a note when usage fails", () => {
      state.usage = { data: undefined, isLoading: false, isError: true }
      render(<ModulesSection branchId="b1" />)
      expect(screen.getByText("cfg_modules_usage_error")).toBeInTheDocument()
      expect(screen.getByRole("switch", { name: "Domicilios" })).toBeEnabled()
    })
  })
})
