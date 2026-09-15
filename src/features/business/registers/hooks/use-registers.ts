import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createRegister,
  getRegisters,
  setRegisterStatus,
  updateRegister,
} from "@/features/business/registers/services/registers.service"
import type { CreateRegisterDto, RegisterStatus, UpdateRegisterDto } from "@/features/business/registers/types/api"

export const registersKeys = {
  all: ["registers"] as const,
  list: (page: number, pageSize: number) => ["registers", "list", page, pageSize] as const,
  detail: (id: string) => ["registers", "detail", id] as const,
}

export function useRegisters(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: registersKeys.list(page, pageSize),
    queryFn: () => getRegisters(page, pageSize),
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
