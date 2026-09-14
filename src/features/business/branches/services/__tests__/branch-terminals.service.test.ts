import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  getBranchTerminalSettings,
  upsertBranchTerminalSettings,
  deactivateBranchTerminals,
  activateBranchTerminals,
} from "@/features/business/branches/services/branch-terminals.service"
import type { BranchTerminalSettingsResponseDto } from "@/features/business/branches/types/terminals-api"
import type { BranchTerminalSettings } from "@/features/business/branches/services/branch-terminals.service"

const FAKE_BRANCH_ID = "11111111-1111-1111-1111-111111111111"

vi.mock("@/config/axios-client", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    },
  }
})

describe("branch-terminals.service", () => {
  let mockApi: {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    patch: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/config/axios-client")
    mockApi = mod.api as unknown as typeof mockApi
  })

  describe("getBranchTerminalSettings", () => {
    it("debe mapear correctamente maxTerminals y areTerminalsEnabled desde el DTO", async () => {
      const dto: BranchTerminalSettingsResponseDto = {
        id: "SETTINGS-001",
        branchId: FAKE_BRANCH_ID,
        maxTerminals: 7,
        areTerminalsEnabled: false,
        createdAt: "2026-01-15T10:30:00Z",
      }

      mockApi.get.mockResolvedValue({ data: dto })

      const result: BranchTerminalSettings =
        await getBranchTerminalSettings(FAKE_BRANCH_ID)

      expect(mockApi.get).toHaveBeenCalledTimes(1)
      expect(mockApi.get).toHaveBeenCalledWith(
        `/api/branches/${FAKE_BRANCH_ID}/terminals/settings`
      )

      expect(result.id).toBe(dto.id)
      expect(result.branchId).toBe(dto.branchId)
      expect(result.maxTerminals).toBe(7)
      expect(result.areTerminalsEnabled).toBe(false)
      expect(result.createdAt).toBe(dto.createdAt)
    })

    it("debe devolver valores por defecto cuando el backend responde id=null", async () => {
      const dto: BranchTerminalSettingsResponseDto = {
        id: null,
        branchId: FAKE_BRANCH_ID,
        maxTerminals: 3,
        areTerminalsEnabled: true,
        createdAt: "2026-01-15T10:30:00Z",
      }

      mockApi.get.mockResolvedValue({ data: dto })
      const result = await getBranchTerminalSettings(FAKE_BRANCH_ID)

      expect(result.id).toBeNull()
      expect(result.maxTerminals).toBe(3)
      expect(result.areTerminalsEnabled).toBe(true)
    })

    it("debe aplicar defaults (max=3, enabled=true) si la llamada falla", async () => {
      mockApi.get.mockRejectedValue(new Error("Network Error"))

      const result = await getBranchTerminalSettings(FAKE_BRANCH_ID)

      expect(result.id).toBeNull()
      expect(result.branchId).toBe(FAKE_BRANCH_ID)
      expect(result.maxTerminals).toBe(3)
      expect(result.areTerminalsEnabled).toBe(true)
    })
  })

  describe("upsertBranchTerminalSettings", () => {
    it("debe llamar POST /api/branches/{id}/terminals/settings con el body correcto y retornar mapeado", async () => {
      const requestBody = { maxTerminals: 5, areTerminalsEnabled: true }

      const responseDto: BranchTerminalSettingsResponseDto = {
        id: "SETTINGS-002",
        branchId: FAKE_BRANCH_ID,
        maxTerminals: 5,
        areTerminalsEnabled: true,
        createdAt: "2026-02-10T09:00:00Z",
      }

      mockApi.post.mockResolvedValue({ data: responseDto })

      const result = await upsertBranchTerminalSettings(FAKE_BRANCH_ID, requestBody)

      expect(mockApi.post).toHaveBeenCalledTimes(1)
      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/branches/${FAKE_BRANCH_ID}/terminals/settings`,
        requestBody
      )

      expect(result.id).toBe(responseDto.id)
      expect(result.maxTerminals).toBe(5)
      expect(result.areTerminalsEnabled).toBe(true)
      expect(result.branchId).toBe(FAKE_BRANCH_ID)
    })

    it("debe enviar solo maxTerminals cuando areTerminalsEnabled no se envía", async () => {
      const requestBody = { maxTerminals: 4 }

      mockApi.post.mockResolvedValue({
        data: {
          id: null,
          branchId: FAKE_BRANCH_ID,
          maxTerminals: 4,
          areTerminalsEnabled: true,
          createdAt: "2026-02-10T09:00:00Z",
        },
      })

      await upsertBranchTerminalSettings(FAKE_BRANCH_ID, requestBody)

      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/branches/${FAKE_BRANCH_ID}/terminals/settings`,
        requestBody
      )
    })
  })

  describe("deactivateBranchTerminals", () => {
    it("debe llamar POST a /api/branches/{id}/terminals/deactivate sin body y retornar void", async () => {
      mockApi.post.mockResolvedValue({ status: 204, data: undefined })

      const result = await deactivateBranchTerminals(FAKE_BRANCH_ID)

      expect(mockApi.post).toHaveBeenCalledTimes(1)
      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/branches/${FAKE_BRANCH_ID}/terminals/deactivate`
      )

      expect(result).toBeUndefined()
    })
  })

  describe("activateBranchTerminals", () => {
    it("debe llamar POST a /api/branches/{id}/terminals/activate", async () => {
      mockApi.post.mockResolvedValue({ status: 204, data: undefined })

      const result = await activateBranchTerminals(FAKE_BRANCH_ID)

      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/branches/${FAKE_BRANCH_ID}/terminals/activate`
      )
      expect(result).toBeUndefined()
    })
  })
})
