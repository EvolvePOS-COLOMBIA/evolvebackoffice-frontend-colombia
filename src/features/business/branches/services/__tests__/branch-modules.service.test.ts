import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/config/axios-client"
import { getModuleUsage } from "@/features/business/branches/services/branch-modules.service"

vi.mock("@/config/axios-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const get = vi.mocked(api.get)

const tenantModule = (overrides: Record<string, unknown> = {}) => ({
  id: "tm-1",
  moduleId: "m-1",
  moduleCode: "MESAS",
  moduleName: "Mesas",
  moduleDescription: null,
  isEnabled: true,
  quantity: 2,
  isBranchScoped: true,
  ...overrides,
})

const branchModule = (branch: string, isEnabled = true) => ({
  id: `bm-${branch}`,
  branchPublicId: branch,
  branchName: `Sede ${branch}`,
  tenantModuleId: 1,
  tenantModulePublicId: "tm-1",
  moduleCode: "MESAS",
  moduleName: "Mesas",
  isEnabled,
  createdAt: "2026-11-19T00:00:00Z",
})

describe("getModuleUsage", () => {
  beforeEach(() => get.mockReset())

  it("uses the backend field without touching branches when present", async () => {
    get.mockResolvedValueOnce({ data: [tenantModule({ assignedCount: 1 })] })

    const usage = await getModuleUsage()

    expect(usage["tm-1"].used).toBe(1)
    expect(get).toHaveBeenCalledTimes(1)
  })

  it("computes usage from every branch when the backend lacks the field", async () => {
    get.mockImplementation(async (url: unknown) => {
      if (url === "/api/tenant-modules") return { data: [tenantModule()] }
      if (url === "/api/Branches") {
        return {
          data: {
            data: [
              { id: "a", name: "Sede a" },
              { id: "b", name: "Sede b" },
            ],
            pageNumber: 1,
            pageSize: 100,
            totalCount: 2,
            totalPages: 1,
          },
        }
      }
      if (url === "/api/Branches/a/modules") return { data: [branchModule("a")] }
      if (url === "/api/Branches/b/modules") return { data: [branchModule("b", false)] }
      return { data: [] }
    })

    const usage = await getModuleUsage()

    expect(usage["tm-1"].used).toBe(1)
    expect(usage["tm-1"].assignedBranches).toEqual([{ branchPublicId: "a", branchName: "Sede a" }])
  })
})
