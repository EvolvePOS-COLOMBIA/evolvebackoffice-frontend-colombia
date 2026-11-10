import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  activateBranchIntegrationStore,
  createBranchIntegration,
  deleteBranchIntegration,
  getBranchIntegration,
  listBranchIntegrations,
  syncBranchIntegrationMenu,
  testBranchIntegrationConnection,
  updateBranchIntegration,
} from "@/features/business/branches/services/branch-integrations.service"
import type {
  ActivateStoreResponse,
  BranchIntegrationResponseDto,
  CreateBranchIntegrationDto,
  SyncMenuResponse,
  TestConnectionResult,
} from "@/features/business/branches/types/integrations-api"

const BRANCH_ID = "11111111-1111-1111-1111-111111111111"
const INTEGRATION_ID = "22222222-2222-2222-2222-222222222222"

vi.mock("@/config/axios-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const dto: BranchIntegrationResponseDto = {
  id: INTEGRATION_ID,
  branchId: BRANCH_ID,
  platformCode: "CLUVI",
  isActive: true,
  baseUrl: "https://api.cluviplatform.click",
  settingsJson: '{"storeId":"34511"}',
  lastSyncedAtUtc: "2026-10-01T12:00:00Z",
  lastSyncStatus: "Success",
  lastError: null,
}

describe("branch-integrations.service", () => {
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

  it("lists integrations and tolerates a non-array payload", async () => {
    api.get.mockResolvedValueOnce({ data: [dto] })
    await expect(listBranchIntegrations(BRANCH_ID)).resolves.toEqual([dto])
    expect(api.get).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations`)

    api.get.mockResolvedValueOnce({ data: { data: [dto] } })
    await expect(listBranchIntegrations(BRANCH_ID)).resolves.toEqual([])

    api.get.mockResolvedValueOnce({ data: null })
    await expect(listBranchIntegrations(BRANCH_ID)).resolves.toEqual([])
  })

  it("gets one integration by id", async () => {
    api.get.mockResolvedValue({ data: dto })

    await expect(getBranchIntegration(BRANCH_ID, INTEGRATION_ID)).resolves.toEqual(dto)
    expect(api.get).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}`)
  })

  it("creates an integration with the documented request body", async () => {
    const payload: CreateBranchIntegrationDto = {
      platformCode: "CLUVI",
      isActive: true,
      baseUrl: "https://api.cluviplatform.click",
      apiKey: "app-123",
      apiSecret: "secret-123",
      settingsJson: '{"storeId":"34511"}',
    }
    api.post.mockResolvedValue({ data: dto })

    await expect(createBranchIntegration(BRANCH_ID, payload)).resolves.toEqual(dto)
    expect(api.post).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations`, payload)
  })

  it("updates with setNew* flags and deletes (soft)", async () => {
    const updatePayload = {
      isActive: true,
      baseUrl: "https://api.cluviplatform.click",
      setNewApiKey: false,
      setNewApiSecret: true,
      apiSecret: "new-secret",
      setNewConsumerKey: false,
      setNewConsumerSecret: false,
    }
    api.put.mockResolvedValue({ status: 204 })
    api.delete.mockResolvedValue({ status: 204 })

    await expect(updateBranchIntegration(BRANCH_ID, INTEGRATION_ID, updatePayload)).resolves.toBeUndefined()
    await expect(deleteBranchIntegration(BRANCH_ID, INTEGRATION_ID)).resolves.toBeUndefined()

    expect(api.put).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}`, updatePayload)
    expect(api.delete).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}`)
  })

  it("tests the connection and surfaces storeStatus", async () => {
    const result: TestConnectionResult = { success: true, message: "ok", storeStatus: "on" }
    api.post.mockResolvedValue({ data: result })

    await expect(testBranchIntegrationConnection(BRANCH_ID, INTEGRATION_ID)).resolves.toEqual(result)
    expect(api.post).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}/test-connection`)
  })

  it("activates the store and returns the registered webhook URLs", async () => {
    const result: ActivateStoreResponse = {
      success: true,
      message: "ok",
      storeStatus: "on",
      newOrderWebhookUrl: "https://api.example.com/api/webhooks/cluvi/t-1?storeId=34511",
      pingWebhookUrl: "https://api.example.com/health",
    }
    api.post.mockResolvedValue({ data: result })

    await expect(activateBranchIntegrationStore(BRANCH_ID, INTEGRATION_ID)).resolves.toEqual(result)
    expect(api.post).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}/activate-store`)
  })

  it("syncs the menu with PUT and no request body", async () => {
    const result: SyncMenuResponse = {
      success: true,
      message: null,
      products: 12,
      categories: 3,
      modifiers: 5,
    }
    api.put.mockResolvedValue({ data: result })

    await expect(syncBranchIntegrationMenu(BRANCH_ID, INTEGRATION_ID)).resolves.toEqual(result)
    expect(api.put).toHaveBeenCalledWith(`/api/branches/${BRANCH_ID}/integrations/${INTEGRATION_ID}/sync-menu`)
  })
})
