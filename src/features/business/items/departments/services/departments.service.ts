import { api } from "@/config/axios-client"
import type { CreateDepartmentDto, Department, PagedDepartments, UpdateDepartmentDto } from "../types"

type PagedPayload = { data?: Department[]; items?: Department[]; totalCount?: number } | Department[]

function normalizePaged(
  payload: PagedPayload | null | undefined,
  pageNumber: number,
  pageSize: number
): PagedDepartments {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      pageNumber,
      pageSize,
      totalCount: payload.length,
      totalPages: Math.ceil(payload.length / pageSize),
    }
  }
  const items = payload?.data ?? payload?.items ?? []
  const totalCount = payload?.totalCount ?? items.length
  return {
    data: items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

/** Lista paginada de departamentos (incluye inactivos). */
export async function getDepartments(pageNumber = 1, pageSize = 200): Promise<PagedDepartments> {
  const { data } = await api.get<PagedPayload>("/api/departments", {
    params: { pageNumber, pageSize },
  })
  return normalizePaged(data, pageNumber, pageSize)
}

/** Todos los departamentos ACTIVOS (para dropdowns). */
export async function getDepartmentsAll(): Promise<Department[]> {
  const { data } = await api.get<Department[] | { data: Department[] }>("/api/departments/all")
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function createDepartment(dto: CreateDepartmentDto): Promise<Department> {
  const { data } = await api.post<Department>("/api/departments", dto)
  return data
}

export async function updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
  const { data } = await api.put<Department>(`/api/departments/${id}`, dto)
  return data
}

export async function setDepartmentActive(id: string, active: boolean): Promise<void> {
  await api.post(`/api/departments/${id}/${active ? "activate" : "deactivate"}`)
}
