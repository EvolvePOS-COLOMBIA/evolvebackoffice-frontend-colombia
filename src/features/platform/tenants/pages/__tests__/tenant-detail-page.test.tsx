/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import { TenantDetailPage } from "@/features/platform/tenants/pages/tenant-detail-page"
import i18n from "@/i18n/index"
import type {
  TenantResponseDto,
  TenantModuleDto,
  PosSerialCodeResponseDto,
} from "@/features/platform/tenants/types/api"

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
  countryCode: "CO",
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

function mockTenantAndSerialCodesRequests() {
  ;(api.get as Mock).mockImplementation((url: string) => {
    if (url === `/api/Tenants/${TENANT_PUBLIC_ID}`) {
      return Promise.resolve({ data: fakeTenantDto })
    }

    if (url === `/api/Tenants/${TENANT_PUBLIC_ID}/serial-codes`) {
      return Promise.resolve({ data: [] })
    }

    return Promise.reject(new Error(`Unexpected GET request: ${url}`))
  })
}

const fakeSerialDto: PosSerialCodeResponseDto = {
  id: "SERIAL-PUB-001",
  serialCode: "POS-123456",
  status: "Unassigned",
  machineIdentifier: null,
  deviceName: null,
  activatedAt: null,
  lastSeenAt: null,
  createdAt: "2025-01-15T10:30:00Z",
}

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
    mockTenantAndSerialCodesRequests()

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

  it("2.4.3 - La seccion de modulos es solo lectura (sin switches, inputs ni boton guardar)", async () => {
    mockTenantAndSerialCodesRequests()

    const modulesClient = {
      get: vi.fn().mockResolvedValue({ data: fakeModulesDto }),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    }
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)

    renderWithProviders()

    const posHeadings = await screen.findAllByText(/punto de venta/i)
    expect(posHeadings.length).toBeGreaterThanOrEqual(1)

    // Estado y cantidad se muestran como texto plano
    expect(screen.getAllByText(/activo/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1)

    // Sin controles de edición ni peticiones de escritura
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0)
    expect(screen.queryAllByRole("button", { name: /guardar/i })).toHaveLength(0)
    expect(modulesClient.put).not.toHaveBeenCalled()
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

  it("2.4.5 - La seccion de seriales POS es solo lectura (la descomision vive en el modal)", async () => {
    ;(api.get as Mock).mockImplementation((url: string) => {
      if (url === `/api/Tenants/${TENANT_PUBLIC_ID}`) {
        return Promise.resolve({ data: fakeTenantDto })
      }

      if (url === `/api/Tenants/${TENANT_PUBLIC_ID}/serial-codes`) {
        return Promise.resolve({ data: [fakeSerialDto] })
      }

      return Promise.reject(new Error(`Unexpected GET request: ${url}`))
    })

    const modulesClient = {
      get: vi.fn().mockResolvedValue({ data: fakeModulesDto }),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: {}, baseURL: "http://localhost" },
    }
    vi.mocked(axios.create).mockReturnValue(modulesClient as unknown as ReturnType<typeof axios.create>)

    renderWithProviders()

    const serialCodes = await screen.findAllByText("POS-123456")
    expect(serialCodes.length).toBeGreaterThanOrEqual(1)

    // Sin acciones inline: ni boton de descomisionar ni campo de motivo
    expect(screen.queryByRole("button", { name: /descomisionar/i })).toBeNull()
    expect(screen.queryByPlaceholderText(/motivo/i)).toBeNull()
  })
})
