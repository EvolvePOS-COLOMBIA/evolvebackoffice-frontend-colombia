import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createRegister,
  getRegisters,
  getTenantSerialCodes,
  setRegisterStatus,
  updateRegister,
} from "@/features/business/registers/services/registers.service"
import type {
  CreateRegisterDto,
  RegisterStatus,
  SerialCodeSummaryDto,
  UpdateRegisterDto,
} from "@/features/business/registers/types/api"

export const registersKeys = {
  all: ["registers"] as const,
  list: (page: number, pageSize: number, search: string) => ["registers", "list", page, pageSize, search] as const,
  detail: (id: string) => ["registers", "detail", id] as const,
  serials: ["registers", "serials"] as const,
}

export function useRegisters(page = 1, pageSize = 10, search = "") {
  return useQuery({
    queryKey: registersKeys.list(page, pageSize, search),
    queryFn: () => getRegisters(page, pageSize, search),
  })
}

/** Pool de seriales POS del tenant (GET /api/tenant-settings/serial-codes). */
export function useTenantSerialCodes() {
  return useQuery<SerialCodeSummaryDto[]>({
    queryKey: registersKeys.serials,
    queryFn: getTenantSerialCodes,
    staleTime: 60_000,
  })
}

export function useCreateRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRegisterDto) => createRegister(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registersKeys.all })
    },
  })
}

export function useUpdateRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRegisterDto }) => updateRegister(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registersKeys.all })
    },
  })
}

export function useSetRegisterStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RegisterStatus }) => setRegisterStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registersKeys.all })
    },
  })
}
