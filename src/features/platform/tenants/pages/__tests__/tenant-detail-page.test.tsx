/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import { TenantDetailPage } from "@/features/platform/tenants/pages/tenant-detail-page"
import i18n from "@/i18n/index"
import type { TenantResponseDto, TenantModuleDto } from "@/features/platform/tenants/types/api"

vi.mock("@/config/axios-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: {}, baseURL: "http://localhost" },
  },
}))

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    })),
  },
}))

import axios from "axios"
import { api } from "@/config/axios-client"

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from "@/features/auth/hooks/use-auth"

vi.mock("@/hooks/use-notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    normal: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
    remove: vi.fn(),
  },
  useNotify: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))
import { notify } from "@/hooks/use-notify"

const TENANT_PUBLIC_ID = "FAKE-GUID-ID-123"
const TENANT_INTERNAL_ID = "TENANT-INT-001"
const FAKE_TOKEN = "fake-token-abc"

const fakeTenantDto: TenantResponseDto = {
  id: TENANT_PUBLIC_ID,
  name: "Northstar Market SAS",
  tenantId: TENANT_INTERNAL_ID,
  contactEmail: "owner@northstar.co",
  phone: "+57 300 111 2233",
  address: "Calle 123 # 45-67, Bogota",
  isActive: true,
  status: "Active",
  maxRegisters: 10,
  currentRegisterCount: 3,
  serialCodes: null,
  createdAt: "2025-01-15T10:30:00Z",
  identificationNumber: "900123456",
  identificationTypeId: 3,
  subdomain: "northstar",
  maxBranches: 5,
  maxUsers: 20,
  createdById: "user-admin",
  rejectionReason: null,
  approvedAt: "2025-01-15T11:00:00Z",
  rejectedAt: null,
}

const fakeModulesDto: TenantModuleDto[] = [
  {
    id: "MOD-PUB-POS-001",
    moduleId: "mod-pos",
    moduleCode: "POS",
    moduleName: "Punto de Venta",
    moduleDescription: "Caja, facturacion y registros",
    isEnabled: true,
    quantity: 5,
    createdAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "MOD-PUB-INV-002",
    moduleId: "mod-inventory",
    moduleCode: "INVENTORY",
    moduleName: "Inventario",
    moduleDescription: "Control de stock y movimientos",
    isEnabled: false,
    quantity: 1,
    createdAt: "2025-01-15T10:30:00Z",
  },
]

function renderWithProviders(initialEntries = [`/platform/tenants/${TENANT_PUBLIC_ID}`]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/platform/tenants/:id" element={children as React.ReactElement} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  )

  return {
    queryClient,
    ...render(<TenantDetailPage />, { wrapper: Wrapper }),
  }
}

describe("TenantDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.changeLanguage("es")

    vi.mocked(useAuth).mockReturnValue({
      session: {
        accessToken: FAKE_TOKEN,
        refreshToken: null,
        expiresAtUtc: "2099-01-01T00:00:00Z",
        user: {
          id: "user-1",
          fullName: "Admin",
          email: "a@a.co",
          role: "PlatformAdmin",
        },
        tenantId: null,
        forcePasswordChange: false,
      },
      tenantId: null,
      isAuthenticated: true,
      isPlatformAdmin: true,
      isPlatformSubAdmin: false,
      isPlatformSupervisor: false,
      isPlatformUser: false,
      isBusinessAdmin: false,
      defaultRoute: "/platform/dashboard",
      hasRole: vi.fn(),
      loginPlatform: vi.fn(),
      loginBusiness: vi.fn(),
      isLogging: false,
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>)
  })

  it("2.4.1 - Muestra loading skeletons cuando los queries aun estan cargando", async () => {
    ;(api.get as Mock).mockImplementation(() => new Promise(() => {}))
    const modulesClient = axios.create()
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)
    ;(modulesClient.get as Mock).mockImplementation(() => new Promise(() => {}))

    renderWithProviders()

    await waitFor(() => {
      const backButton = screen.getByRole("button", {
        name: /volver a tenants/i,
      })
      expect(backButton).toBeInTheDocument()
    })

    expect(screen.queryByText(/northstar market/i)).toBeNull()
  })

  it("2.4.2 - Muestra breadcrumb, nombre del tenant y campos summary cuando fetch exitoso", async () => {
    ;(api.get as Mock).mockResolvedValue({ data: fakeTenantDto })

    const modulesClient = {
      get: vi.fn().mockResolvedValue({ data: fakeModulesDto }),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    }
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)

    renderWithProviders()

    const heading = await screen.findByRole("heading", {
      name: /northstar market sas/i,
      level: 1,
    })
    expect(heading).toBeInTheDocument()

    const backButtons = screen.getAllByRole("button", {
      name: /volver a tenants/i,
    })
    expect(backButtons.length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText(/detalle del tenant/i)).toBeInTheDocument()

    const statusBadges = screen.getAllByText(/activo/i)
    expect(statusBadges.length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText(TENANT_INTERNAL_ID)).toBeInTheDocument()
    expect(screen.getByText("owner@northstar.co")).toBeInTheDocument()
    expect(screen.getByText("+57 300 111 2233")).toBeInTheDocument()
    expect(screen.getByText(/calle 123/i)).toBeInTheDocument()

    const posName = await screen.findAllByText(/punto de venta/i)
    expect(posName.length).toBeGreaterThanOrEqual(1)
    const invName = screen.getAllByText(/inventario/i)
    expect(invName.length).toBeGreaterThanOrEqual(1)

    const numberTiles = screen.getAllByText("2")
    expect(numberTiles.length).toBeGreaterThanOrEqual(1)
    const activeTiles = screen.getAllByText("1")
    expect(activeTiles.length).toBeGreaterThanOrEqual(1)
  })

  it("2.4.3 - Switch isEnabled y boton Save quantity disparan mutation y notify.success", async () => {
    ;(api.get as Mock).mockResolvedValue({ data: fakeTenantDto })

    const updatedModuleDto: TenantModuleDto = {
      ...fakeModulesDto[0]!,
      quantity: 7,
    }

    const modulesClient = {
      get: vi.fn().mockResolvedValue({ data: fakeModulesDto }),
      put: vi.fn().mockResolvedValue({ data: updatedModuleDto }),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    }
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)

    renderWithProviders()

    const posHeadings = await screen.findAllByText(/punto de venta/i)
    expect(posHeadings.length).toBeGreaterThanOrEqual(1)

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[]
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    const posInput = inputs[0]!
    fireEvent.change(posInput, { target: { value: "7" } })
    expect(posInput.value).toBe("7")

    const saveButtons = screen.getAllByRole("button", { name: /guardar/i })
    expect(saveButtons.length).toBeGreaterThanOrEqual(2)
    const firstSave = saveButtons[0]!
    fireEvent.click(firstSave)

    await waitFor(() => {
      expect(modulesClient.put).toHaveBeenCalledWith(`/api/tenant-modules/${fakeModulesDto[0]!.id}`, { quantity: 7 })
      expect(notify.success).toHaveBeenCalledTimes(1)
    })

    modulesClient.put.mockReset()
    vi.mocked(notify.success).mockReset()

    const toggledDto: TenantModuleDto = {
      ...fakeModulesDto[1]!,
      isEnabled: true,
    }
    modulesClient.put.mockResolvedValue({ data: toggledDto })

    const switches = screen.getAllByRole("switch")
    expect(switches.length).toBeGreaterThanOrEqual(2)
    const inventorySwitch = switches[1]!
    fireEvent.click(inventorySwitch)

    await waitFor(() => {
      expect(modulesClient.put).toHaveBeenCalledWith(`/api/tenant-modules/${fakeModulesDto[1]!.id}`, {
        isEnabled: true,
      })
      expect(notify.success).toHaveBeenCalledTimes(1)
    })
  })

  it("2.4.4 - Cuando fetch tenant da error 404 muestra ErrorState/Not found", async () => {
    const notFoundError = new Error("Request failed with status code 404")
    ;(api.get as Mock).mockRejectedValue(notFoundError)

    const modulesClient = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    }
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)

    renderWithProviders()

    const errorTitle = await screen.findByText(/no se pudo cargar el tenant/i)
    expect(errorTitle).toBeInTheDocument()

    expect(screen.getByText(/el tenant solicitado no existe/i)).toBeInTheDocument()

    const backButtons = screen.getAllByRole("button", {
      name: /volver a tenants/i,
    })
    expect(backButtons.length).toBeGreaterThanOrEqual(1)
  })
})
