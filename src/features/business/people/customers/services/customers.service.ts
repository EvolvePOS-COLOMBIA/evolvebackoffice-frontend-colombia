import { api } from "@/config/axios-client"
import type { CreateCustomerDto, CustomerListResult, CustomerResponseDto, UpdateCustomerDto } from "../types"

export async function getCustomers(pageNumber = 1, pageSize = 100): Promise<CustomerListResult> {
  const { data } = await api.get<{ data: CustomerResponseDto[]; totalCount: number }>("/api/customers", {
    params: { pageNumber, pageSize },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export async function createCustomer(payload: CreateCustomerDto): Promise<CustomerResponseDto> {
  const { data } = await api.post<CustomerResponseDto>("/api/customers", payload)
  return data
}

export async function updateCustomer(id: string, payload: UpdateCustomerDto): Promise<CustomerResponseDto> {
  const { data } = await api.put<CustomerResponseDto>(`/api/customers/${id}`, payload)
  return data
}

export async function deactivateCustomer(id: string): Promise<void> {
  await api.delete(`/api/customers/${id}`)
}

export async function activateCustomer(id: string): Promise<void> {
  await api.post(`/api/customers/${id}/activate`)
}
