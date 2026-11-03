import { api } from "@/config/axios-client"
import type { CreateSupplierDto, SupplierListResult, SupplierResponseDto, UpdateSupplierDto } from "../types"

export async function getSuppliers(pageNumber = 1, pageSize = 100): Promise<SupplierListResult> {
  const { data } = await api.get<{ data: SupplierResponseDto[]; totalCount: number }>("/api/suppliers", {
    params: { pageNumber, pageSize },
  })
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

export async function createSupplier(payload: CreateSupplierDto): Promise<SupplierResponseDto> {
  const { data } = await api.post<SupplierResponseDto>("/api/suppliers", payload)
  return data
}

export async function updateSupplier(id: string, payload: UpdateSupplierDto): Promise<SupplierResponseDto> {
  const { data } = await api.put<SupplierResponseDto>(`/api/suppliers/${id}`, payload)
  return data
}

export async function deactivateSupplier(id: string): Promise<void> {
  await api.post(`/api/suppliers/${id}/deactivate`)
}

export async function activateSupplier(id: string): Promise<void> {
  await api.post(`/api/suppliers/${id}/activate`)
}
