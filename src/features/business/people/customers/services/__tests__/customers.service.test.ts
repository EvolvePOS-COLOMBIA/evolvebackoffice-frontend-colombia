import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/config/axios-client"

import { createCustomer, deleteCustomer, getCustomerById, getCustomers, updateCustomer } from "../customers.service"

vi.mock("@/config/axios-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

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

describe("getCustomers", () => {
  it("sends GET with pagination params", async () => {
    mockApi.get.mockResolvedValue({ data: [sampleCustomer] })

    const result = await getCustomers({ pageNumber: 2, pageSize: 10 })

    expect(mockApi.get).toHaveBeenCalledWith("/api/Customers", {
      params: { pageNumber: 2, pageSize: 10, searchField: undefined, searchValue: undefined },
    })
    expect(result).toEqual([sampleCustomer])
  })

  it("sends search params when provided", async () => {
    mockApi.get.mockResolvedValue({ data: [sampleCustomer] })

    await getCustomers({ pageNumber: 1, pageSize: 20, searchField: "name", searchValue: "Carlos" })

    expect(mockApi.get).toHaveBeenCalledWith("/api/Customers", {
      params: { pageNumber: 1, pageSize: 20, searchField: "name", searchValue: "Carlos" },
    })
  })

  it("normalizes paged envelope response to array", async () => {
    mockApi.get.mockResolvedValue({
      data: { data: [sampleCustomer], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await getCustomers({ pageNumber: 1, pageSize: 20 })

    expect(result).toEqual([sampleCustomer])
  })

  it("returns empty array when response is null", async () => {
    mockApi.get.mockResolvedValue({ data: null })

    const result = await getCustomers({ pageNumber: 1, pageSize: 20 })

    expect(result).toEqual([])
  })
})

describe("getCustomerById", () => {
  it("sends GET with customer id", async () => {
    mockApi.get.mockResolvedValue({ data: sampleCustomer })

    const result = await getCustomerById("abc-123")

    expect(mockApi.get).toHaveBeenCalledWith("/api/Customers/abc-123")
    expect(result).toEqual(sampleCustomer)
  })
})

describe("createCustomer", () => {
  it("sends POST with payload", async () => {
    mockApi.post.mockResolvedValue({ data: sampleCustomer })

    const payload = {
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
    }

    const result = await createCustomer(payload)

    expect(mockApi.post).toHaveBeenCalledWith("/api/Customers", payload)
    expect(result).toEqual(sampleCustomer)
  })
})

describe("updateCustomer", () => {
  it("sends PUT with id and payload", async () => {
    mockApi.put.mockResolvedValue({ data: sampleCustomer })

    const payload = { firstName: "Ana" }

    const result = await updateCustomer("abc-123", payload)

    expect(mockApi.put).toHaveBeenCalledWith("/api/Customers/abc-123", payload)
    expect(result).toEqual(sampleCustomer)
  })
})

describe("deleteCustomer", () => {
  it("sends DELETE with id", async () => {
    mockApi.delete.mockResolvedValue({})

    await deleteCustomer("abc-123")

    expect(mockApi.delete).toHaveBeenCalledWith("/api/Customers/abc-123")
  })
})
