import { api } from "@/config/axios-client"
import type { CreateCustomerDto, CustomerResponseDto, UpdateCustomerDto } from "../types"

export interface GetCustomersParams {
  pageNumber: number
  pageSize: number
  searchField?: string
  searchValue?: string
}

/**
 * GET /api/Customers — normaliza array plano o sobre paginado.
 * El Swagger no documenta la forma exacta del 200, así que aceptamos ambos.
 */
export async function getCustomers(params: GetCustomersParams): Promise<CustomerResponseDto[]> {
  const { data } = await api.get<CustomerResponseDto[] | { data: CustomerResponseDto[] }>("/api/Customers", {
    params: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchField: params.searchField,
      searchValue: params.searchValue,
    },
  })

  if (Array.isArray(data)) {
    return data
  }

  return data?.data ?? []
}

export async function getCustomerById(id: string): Promise<CustomerResponseDto> {
  const { data } = await api.get<CustomerResponseDto>(`/api/Customers/${id}`)
  return data
}

export async function createCustomer(payload: CreateCustomerDto): Promise<CustomerResponseDto> {
  const { data } = await api.post<CustomerResponseDto>("/api/Customers", payload)
  return data
}

export async function updateCustomer(id: string, payload: UpdateCustomerDto): Promise<CustomerResponseDto> {
  const { data } = await api.put<CustomerResponseDto>(`/api/Customers/${id}`, payload)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/api/Customers/${id}`)
}
