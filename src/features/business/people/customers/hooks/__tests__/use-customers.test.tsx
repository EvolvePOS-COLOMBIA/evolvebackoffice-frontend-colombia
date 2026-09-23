import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as service from "../../services/customers.service"
import { useCreateCustomer, useCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "../use-customers"

vi.mock("../../services/customers.service", () => ({
  getCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}))

const mockGetCustomers = vi.mocked(service.getCustomers)
const mockGetCustomerById = vi.mocked(service.getCustomerById)
const mockCreateCustomer = vi.mocked(service.createCustomer)
const mockUpdateCustomer = vi.mocked(service.updateCustomer)
const mockDeleteCustomer = vi.mocked(service.deleteCustomer)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const sampleCustomer = {
  id: "abc-123",
  personPublicId: null,
  firstName: "Carlos",
  lastName: "Perez",
  identificationTypeId: 1,
  identificationNumber: "1023456789",
  address: null,
  phoneNumber: "3000000000",
  emailAddress: "carlos@test.com",
  city: "Bogota",
  department: "Cundinamarca",
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useCustomers", () => {
  it("fetches customers with pagination params", async () => {
    mockGetCustomers.mockResolvedValue([sampleCustomer])

    const { result } = renderHook(() => useCustomers(1, 20, ""), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetCustomers).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 20,
      searchField: undefined,
      searchValue: undefined,
    })
    expect(result.current.data).toEqual([sampleCustomer])
  })

  it("sends search params when search is provided", async () => {
    mockGetCustomers.mockResolvedValue([sampleCustomer])

    const { result } = renderHook(() => useCustomers(1, 20, "Carlos"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetCustomers).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 20,
      searchField: "name",
      searchValue: "Carlos",
    })
  })
})

describe("useCustomer", () => {
  it("fetches customer by id when id is provided", async () => {
    mockGetCustomerById.mockResolvedValue(sampleCustomer)

    const { result } = renderHook(() => useCustomer("abc-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetCustomerById).toHaveBeenCalledWith("abc-123")
    expect(result.current.data).toEqual(sampleCustomer)
  })

  it("does not fetch when id is null", () => {
    const { result } = renderHook(() => useCustomer(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(mockGetCustomerById).not.toHaveBeenCalled()
  })
})

describe("useCreateCustomer", () => {
  it("calls createCustomer and returns result", async () => {
    mockCreateCustomer.mockResolvedValue(sampleCustomer)

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockCreateCustomer).toHaveBeenCalled()
  })
})

describe("useUpdateCustomer", () => {
  it("calls updateCustomer with id and payload", async () => {
    mockUpdateCustomer.mockResolvedValue(sampleCustomer)

    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: "abc-123", payload: { firstName: "Ana" } })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockUpdateCustomer).toHaveBeenCalledWith("abc-123", { firstName: "Ana" })
  })
})

describe("useDeleteCustomer", () => {
  it("calls deleteCustomer with id", async () => {
    mockDeleteCustomer.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: createWrapper(),
    })

    result.current.mutate("abc-123")

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockDeleteCustomer).toHaveBeenCalledWith("abc-123")
  })
})
