import { describe, it, expect, vi, beforeEach } from "vitest"
import axios from "axios"

import { getTenantModules } from "@/features/platform/tenants/services/tenant-modules.service"
import type { TenantModuleDto } from "@/features/platform/tenants/types/api"
import type { TenantModule } from "@/features/platform/tenants/types"

vi.mock("axios")

const FAKE_TOKEN = "fake-token-123"
const FAKE_TENANT_ID = "TENANT-001"

const mockDto1: TenantModuleDto = {
  id: "MODULE-PUB-001",
  moduleId: "mod-internal-1",
  moduleCode: "POS",
  moduleName: "Punto de Venta",
  moduleDescription: "Módulo principal de POS",
  isEnabled: true,
  quantity: 5,
  createdAt: "2025-01-15T10:30:00Z",
}

const mockDto2: TenantModuleDto = {
  id: "MODULE-PUB-002",
  moduleId: "mod-internal-2",
  moduleCode: "ORDERS",
  moduleName: "Pedidos",
  moduleDescription: null,
  isEnabled: false,
  quantity: 2,
  createdAt: "2025-01-15T10:30:00Z",
}

describe("tenant-modules.service", () => {
  let mockGet: ReturnType<typeof vi.fn>
  let mockPut: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGet = vi.fn()
    mockPut = vi.fn()
    vi.mocked(axios.create).mockReturnValue({
      get: mockGet,
      put: mockPut,
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    } as unknown as ReturnType<typeof axios.create>)
  })

  describe("getTenantModules", () => {
    it("debe retornar array mapeado correctamente cuando el response viene como array directo", async () => {
      const dtos: TenantModuleDto[] = [mockDto1, mockDto2]
      mockGet.mockResolvedValue({ data: dtos })

      const result: TenantModule[] = await getTenantModules(FAKE_TOKEN, FAKE_TENANT_ID)

      expect(axios.create).toHaveBeenCalledTimes(1)
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${FAKE_TOKEN}`,
            "X-Tenant-Id": FAKE_TENANT_ID,
          }),
        })
      )

      expect(mockGet).toHaveBeenCalledWith("/api/tenant-modules")
      expect(result).toHaveLength(2)
      expect(result[0]!).toEqual<TenantModule>({
        id: mockDto1.id,
        moduleId: mockDto1.moduleId,
        moduleCode: mockDto1.moduleCode,
        moduleName: mockDto1.moduleName,
        moduleDescription: mockDto1.moduleDescription,
        isEnabled: mockDto1.isEnabled,
        quantity: mockDto1.quantity ?? 0,
        createdAt: mockDto1.createdAt,
      })
      expect(result[1]!).toEqual<TenantModule>({
        id: mockDto2.id,
        moduleId: mockDto2.moduleId,
        moduleCode: mockDto2.moduleCode,
        moduleName: mockDto2.moduleName,
        moduleDescription: mockDto2.moduleDescription,
        isEnabled: mockDto2.isEnabled,
        quantity: mockDto2.quantity ?? 0,
        createdAt: mockDto2.createdAt,
      })
    })

    it("debe manejar response paginado y extraer data.items", async () => {
      const dtos: TenantModuleDto[] = [mockDto1]
      mockGet.mockResolvedValue({
        data: {
          data: dtos,
          pageNumber: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
        },
      })

      const result = await getTenantModules(FAKE_TOKEN, FAKE_TENANT_ID)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(mockDto1.id)
      expect(result[0]!.moduleCode).toBe("POS")
    })

    it("debe retornar [] si response es null", async () => {
      mockGet.mockResolvedValue({ data: null })
      const result = await getTenantModules(FAKE_TOKEN, FAKE_TENANT_ID)
      expect(result).toEqual([])
    })
  })
})
