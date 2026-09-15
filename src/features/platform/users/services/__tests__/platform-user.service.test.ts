import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  listPlatformUsers,
  getPlatformUser,
  createPlatformUser,
  updatePlatformUser,
  toBackendRole,
  toAppRole,
} from "@/features/platform/users/services/platform-user.service"
import type { PlatformUserListResponse, PlatformUserResponse } from "@/features/platform/users/types/api"

const FAKE_USER_ID = "11111111-1111-1111-1111-111111111111"

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

describe("platform-user.service", () => {
  let mockApi: {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/config/axios-client")
    mockApi = mod.api as unknown as typeof mockApi
  })

  describe("toBackendRole", () => {
    it("mapea PlatformAdmin a ADMIN", () => {
      expect(toBackendRole("PlatformAdmin")).toBe("ADMIN")
    })

    it("mapea PlatformSubAdmin a SUBADMIN", () => {
      expect(toBackendRole("PlatformSubAdmin")).toBe("SUBADMIN")
    })

    it("mapea PlatformSupervisor a SUPERVISOR", () => {
      expect(toBackendRole("PlatformSupervisor")).toBe("SUPERVISOR")
    })
  })

  describe("toAppRole", () => {
    it("mapea ADMIN a PlatformAdmin", () => {
      expect(toAppRole("ADMIN")).toBe("PlatformAdmin")
    })

    it("mapea SUBADMIN a PlatformSubAdmin", () => {
      expect(toAppRole("SUBADMIN")).toBe("PlatformSubAdmin")
    })

    it("mapea SUPERVISOR a PlatformSupervisor", () => {
      expect(toAppRole("SUPERVISOR")).toBe("PlatformSupervisor")
    })
  })

  describe("listPlatformUsers", () => {
    it("mapea los roles del backend a AppRole", async () => {
      const dtos: PlatformUserListResponse[] = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          email: "admin@test.com",
          fullName: "Admin Uno",
          role: "ADMIN",
          isActive: true,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: null,
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          email: "sub@test.com",
          fullName: "Sub Dos",
          role: "SUBADMIN",
          isActive: true,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: null,
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          email: "sup@test.com",
          fullName: "Sup Tres",
          role: "SUPERVISOR",
          isActive: false,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: "2026-02-01T08:00:00Z",
        },
      ]

      mockApi.get.mockResolvedValue({ data: dtos })

      const result = await listPlatformUsers()

      expect(mockApi.get).toHaveBeenCalledWith("/api/platform-users")
      expect(result).toHaveLength(3)
      expect(result.map((u) => u.role)).toEqual(["PlatformAdmin", "PlatformSubAdmin", "PlatformSupervisor"])
    })
  })

  describe("getPlatformUser", () => {
    it("mapea el rol del backend a AppRole", async () => {
      const dto: PlatformUserResponse = {
        id: FAKE_USER_ID,
        email: "admin@test.com",
        fullName: "Admin Uno",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-01-15T10:30:00Z",
        lastLoginAt: null,
      }

      mockApi.get.mockResolvedValue({ data: dto })

      const result = await getPlatformUser(FAKE_USER_ID)

      expect(mockApi.get).toHaveBeenCalledWith(`/api/platform-users/${FAKE_USER_ID}`)
      expect(result.role).toBe("PlatformAdmin")
    })
  })

  describe("createPlatformUser", () => {
    it("envía el rol en formato del backend (ADMIN/SUBADMIN/SUPERVISOR)", async () => {
      mockApi.post.mockResolvedValue({
        data: {
          id: FAKE_USER_ID,
          email: "nuevo@test.com",
          fullName: "Nuevo Admin",
          role: "ADMIN",
          isActive: true,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: null,
        },
      })

      await createPlatformUser({
        email: "nuevo@test.com",
        fullName: "Nuevo Admin",
        password: "Secret123!",
        role: "PlatformAdmin",
      })

      expect(mockApi.post).toHaveBeenCalledWith("/api/platform-users", {
        email: "nuevo@test.com",
        fullName: "Nuevo Admin",
        password: "Secret123!",
        role: "ADMIN",
      })
    })
  })

  describe("updatePlatformUser", () => {
    it("mapea el rol a formato backend cuando se envía", async () => {
      mockApi.put.mockResolvedValue({
        data: {
          id: FAKE_USER_ID,
          email: "admin@test.com",
          fullName: "Admin Uno",
          role: "SUPERVISOR",
          isActive: true,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: null,
        },
      })

      await updatePlatformUser(FAKE_USER_ID, { role: "PlatformSupervisor" })

      expect(mockApi.put).toHaveBeenCalledWith(`/api/platform-users/${FAKE_USER_ID}`, {
        role: "SUPERVISOR",
      })
    })

    it("omite el rol cuando no se envía", async () => {
      mockApi.put.mockResolvedValue({
        data: {
          id: FAKE_USER_ID,
          email: "admin@test.com",
          fullName: "Admin Renombrado",
          role: "ADMIN",
          isActive: true,
          createdAt: "2026-01-15T10:30:00Z",
          lastLoginAt: null,
        },
      })

      await updatePlatformUser(FAKE_USER_ID, { fullName: "Admin Renombrado" })

      expect(mockApi.put).toHaveBeenCalledWith(`/api/platform-users/${FAKE_USER_ID}`, {
        fullName: "Admin Renombrado",
        role: undefined,
      })
    })
  })
})
