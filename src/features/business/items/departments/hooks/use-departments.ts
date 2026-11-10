import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createDepartment,
  getDepartments,
  getDepartmentsAll,
  setDepartmentActive,
  updateDepartment,
} from "../services/departments.service"
import type { CreateDepartmentDto, UpdateDepartmentDto } from "../types"

export const departmentsKeys = {
  all: ["departments"] as const,
  list: (page: number, pageSize: number) => ["departments", "list", page, pageSize] as const,
  allActive: ["departments", "all"] as const,
}

export function useDepartments(page = 1, pageSize = 200) {
  return useQuery({
    queryKey: departmentsKeys.list(page, pageSize),
    queryFn: () => getDepartments(page, pageSize),
  })
}

/** Departamentos activos (dropdowns de otros formularios). */
export function useDepartmentsAll() {
  return useQuery({
    queryKey: departmentsKeys.allActive,
    queryFn: getDepartmentsAll,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDepartmentDto) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentDto }) => updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useSetDepartmentActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setDepartmentActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
