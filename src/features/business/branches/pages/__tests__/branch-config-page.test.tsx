/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"

import type { Branch } from "../../types"
import { BranchConfigPage } from "../branch-config-page"

const state = vi.hoisted(() => ({
  tenantModules: [] as Array<{ id: string; moduleCode: string; moduleName: string; isEnabled: boolean }>,
  branchModules: [] as Array<{ id: string; tenantModuleId: number; moduleCode: string; isEnabled: boolean }>,
  updateMutate: vi.fn(),
}))

vi.mock("@/i18n/use-i18n", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}|${Object.values(options).join("|")}` : key,
    i18n: { language: "es" },
  }),
}))

const branch: Branch = {
  id: "b1",
  name: "Sede Medellín",
  identification: "901234567-2",
  address: "Calle 1",
  phone: "300",
  email: "a@b.co",
  isActive: true,
  adminUserId: "u1",
  adminUserName: "Ana",
  createdAt: "2026-11-18T00:00:00Z",
  isSupplier: false,
  latitude: "6.2",
  longitude: "-75.5",
}

vi.mock("@/features/business/branches/services/branches.service", () => ({
  getBranchById: () => Promise.resolve(branch),
}))
vi.mock("@/features/business/branches/hooks/use-branch-modules", () => ({
  useTenantModules: () => ({ data: state.tenantModules, isLoading: false }),
  useBranchModules: () => ({ data: state.branchModules, isLoading: false }),
  useAssignModuleToBranch: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveModuleFromBranch: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/business/branches/hooks/use-branch-terminals", () => ({
  useBranchRegisters: () => ({ data: [], isLoading: false }),
  useBranchTerminalSettings: () => ({ data: { maxTerminals: 3, areTerminalsEnabled: true }, isLoading: false }),
  useUpsertBranchTerminalSettings: () => ({ mutate: vi.fn(), isPending: false }),
  useActivateBranchTerminals: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateBranchTerminals: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/business/branches/hooks/use-branch-integrations", () => ({
  useBranchIntegrations: () => ({ data: [{ platformCode: "CLUVI", isActive: true }], isLoading: false }),
}))
vi.mock("@/features/business/branches/hooks/use-branch-schedule", () => ({
  useBranchSchedule: () => ({
    data: {
      supportsPerDay: true,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayOfWeek) => ({
        dayOfWeek,
        isOpen: true,
        openingTime: "08:00:00",
        closingTime: "22:00:00",
      })),
    },
    isLoading: false,
  }),
  useUpdateBranchSchedule: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/business/branches/hooks/use-branches", () => ({
  useUpdateBranch: () => ({ mutate: state.updateMutate, isPending: false }),
  useActivateBranch: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateBranch: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/business/people/users/hooks/use-users", () => ({
  useUsers: () => ({ data: [], isLoading: false }),
}))
vi.mock("@/features/business/delivery/hooks/use-delivery", () => ({
  useBranchDeliverySettings: () => ({ data: undefined, isLoading: false }),
  useUpdateBranchDeliverySettings: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/features/business/branches/components/integration-panel", () => ({
  IntegrationPanel: ({ platform }: { platform: string }) => <div data-testid="integration-panel">{platform}</div>,
}))
vi.mock("@/hooks/use-geolocation", () => ({
  useGeolocation: () => ({ isLocating: false, requestLocation: vi.fn() }),
}))

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

function setup(path = "/business/branches/b1/config") {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/business/branches/:branchId/config" element={<BranchConfigPage />} />
        </Routes>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const heading = () => screen.getByRole("heading", { level: 2 })

beforeEach(() => {
  state.updateMutate.mockReset()
  state.tenantModules = [
    { id: "1", moduleCode: "DOMICILIOS", moduleName: "Domicilios", isEnabled: true },
    { id: "2", moduleCode: "MESAS", moduleName: "Mesas", isEnabled: false },
  ]
  state.branchModules = [{ id: "bm1", tenantModuleId: 1, moduleCode: "DOMICILIOS", isEnabled: true }]
})

describe("BranchConfigPage", () => {
  it("opens on the information section with the branch name in the hero", async () => {
    setup()
    expect(await screen.findByText("Sede Medellín")).toBeInTheDocument()
    expect(heading()).toHaveTextContent("section_info")
  })

  it("lists the sections grouped in the side menu", async () => {
    setup()
    await screen.findByText("Sede Medellín")
    const nav = screen.getByRole("navigation", { name: "cfg_nav_label" })
    for (const key of ["section_info", "section_schedule", "section_modules", "section_terminals", "section_cluvi"]) {
      expect(nav).toHaveTextContent(key)
    }
  })

  it("changes section from the menu and keeps it in the URL", async () => {
    setup()
    await screen.findByText("Sede Medellín")
    fireEvent.click(screen.getByRole("button", { name: /section_schedule/ }))
    expect(heading()).toHaveTextContent("section_schedule")
    expect(screen.getByTestId("where")).toHaveTextContent("?tab=schedule")
  })

  it("opens the section of a deep link", async () => {
    setup("/business/branches/b1/config?tab=modules")
    await screen.findByText("Sede Medellín")
    expect(heading()).toHaveTextContent("section_modules")
  })

  it("still understands the old serials link", async () => {
    setup("/business/branches/b1/config?tab=serials")
    await screen.findByText("Sede Medellín")
    expect(heading()).toHaveTextContent("section_terminals")
  })

  it("hides delivery when the license has no DOMICILIOS", async () => {
    state.tenantModules = [{ id: "2", moduleCode: "MESAS", moduleName: "Mesas", isEnabled: true }]
    setup()
    await screen.findByText("Sede Medellín")
    expect(screen.queryByRole("button", { name: /section_delivery/ })).toBeNull()
  })

  it("shows the integration panel for the platform of the section", async () => {
    setup("/business/branches/b1/config?tab=cluvi")
    expect(await screen.findByTestId("integration-panel")).toHaveTextContent("CLUVI")
  })

  it("shows the save bar after editing and saves the full payload", async () => {
    setup()
    await screen.findByText("Sede Medellín")
    expect(screen.queryByText("cfg_unsaved")).toBeNull()

    fireEvent.change(screen.getByDisplayValue("Sede Medellín"), { target: { value: "Sede Centro" } })
    expect(await screen.findByText("cfg_unsaved")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "save_changes" }))
    await waitFor(() => expect(state.updateMutate).toHaveBeenCalled())
    const { id, payload } = state.updateMutate.mock.calls[0][0]
    expect(id).toBe("b1")
    expect(payload).toMatchObject({ name: "Sede Centro", latitude: 6.2, longitude: -75.5, isSupplier: false })
  })

  it("keeps an unsaved edit when the user changes section and comes back", async () => {
    setup()
    await screen.findByText("Sede Medellín")
    fireEvent.change(screen.getByDisplayValue("Sede Medellín"), { target: { value: "Sede Centro" } })

    fireEvent.click(screen.getByRole("button", { name: /section_schedule/ }))
    expect(heading()).toHaveTextContent("section_schedule")
    // The section with pending changes is flagged in the menu while the user is elsewhere.
    expect(await screen.findByTitle("cfg_unsaved")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /section_info/ }))
    expect(heading()).toHaveTextContent("section_info")
    expect(screen.getByDisplayValue("Sede Centro")).toBeInTheDocument()
  })

  it("shows the branch status and the terminal usage in the hero", async () => {
    setup()
    expect(await screen.findByText("status_active")).toBeInTheDocument()
    expect(screen.getByText("0/3")).toBeInTheDocument()
    expect(screen.getByText("1/2")).toBeInTheDocument()
  })

  it("discards the edits", async () => {
    setup()
    await screen.findByText("Sede Medellín")
    fireEvent.change(screen.getByDisplayValue("Sede Medellín"), { target: { value: "Otro" } })
    fireEvent.click(await screen.findByRole("button", { name: "cfg_discard" }))
    await waitFor(() => expect(screen.queryByText("cfg_unsaved")).toBeNull())
    expect(screen.getByDisplayValue("Sede Medellín")).toBeInTheDocument()
  })
})
