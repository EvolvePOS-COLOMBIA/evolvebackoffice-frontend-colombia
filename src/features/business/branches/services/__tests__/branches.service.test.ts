import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  activateBranch,
  createBranch,
  deactivateBranch,
  getBranches,
  updateBranch,
} from "@/features/business/branches/services/branches.service"
import type { BranchResponseDto, CreateBranchDto, UpdateBranchDto } from "@/features/business/branches/types/api"

const BRANCH_ID = "11111111-1111-1111-1111-111111111111"

vi.mock("@/config/axios-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const dto: BranchResponseDto = {
  id: BRANCH_ID,
  name: "Sucursal Centro",
  identification: "900123456-7",
  address: "Cra. 7 # 72-41",
  phone: "+57 300 123 4567",
  email: "centro@mitienda.com",
  isActive: true,
  adminUserPublicId: "22222222-2222-2222-2222-222222222222",
  adminUserName: "Ana Admin",
  createdAt: "2026-09-15T12:00:00Z",
}

describe("branches.service", () => {
  let api: {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    api = (await import("@/config/axios-client")).api as unknown as typeof api
  })

  it("lists and maps paged branches using the Swagger search parameters", async () => {
    api.get.mockResolvedValue({
      data: { data: [dto], pageNumber: 2, pageSize: 10, totalCount: 11, totalPages: 2 },
    })

    const result = await getBranches(2, 10, { searchField: "name", searchValue: "Centro" })

    expect(api.get).toHaveBeenCalledWith("/api/Branches", {
      params: { pageNumber: 2, pageSize: 10, searchField: "name", searchValue: "Centro" },
    })
    expect(result).toEqual({
      data: [
        {
          id: BRANCH_ID,
          name: "Sucursal Centro",
          identification: "900123456-7",
          address: "Cra. 7 # 72-41",
          phone: "+57 300 123 4567",
          email: "centro@mitienda.com",
          isActive: true,
          adminUserId: "22222222-2222-2222-2222-222222222222",
          adminUserName: "Ana Admin",
          createdAt: "2026-09-15T12:00:00Z",
        },
      ],
      pageNumber: 2,
      pageSize: 10,
      totalCount: 11,
      totalPages: 2,
    })
  })

  it("creates and updates a branch with the documented request bodies", async () => {
    const createPayload: CreateBranchDto = {
      name: "Sucursal Centro",
      adminUserId: null,
      identification: null,
      address: null,
      phone: null,
      email: null,
    }
    const updatePayload: UpdateBranchDto = { ...createPayload, name: "Sucursal Norte" }
    api.post.mockResolvedValue({ data: dto })
    api.put.mockResolvedValue({ data: { ...dto, name: "Sucursal Norte" } })

    await expect(createBranch(createPayload)).resolves.toMatchObject({ id: BRANCH_ID, name: "Sucursal Centro" })
    await expect(updateBranch(BRANCH_ID, updatePayload)).resolves.toMatchObject({
      id: BRANCH_ID,
      name: "Sucursal Norte",
    })

    expect(api.post).toHaveBeenCalledWith("/api/Branches", createPayload)
    expect(api.put).toHaveBeenCalledWith(`/api/Branches/${BRANCH_ID}`, updatePayload)
  })

  it("uses soft-delete and activate endpoints without a request body", async () => {
    api.delete.mockResolvedValue({ status: 204 })
    api.post.mockResolvedValue({ status: 204 })

    await expect(deactivateBranch(BRANCH_ID)).resolves.toBeUndefined()
    await expect(activateBranch(BRANCH_ID)).resolves.toBeUndefined()

    expect(api.delete).toHaveBeenCalledWith(`/api/Branches/${BRANCH_ID}`)
    expect(api.post).toHaveBeenCalledWith(`/api/Branches/${BRANCH_ID}/activate`)
  })
})
