import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activateSupplier,
  createSupplier,
  deactivateSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/suppliers.service"
import type { CreateSupplierDto, UpdateSupplierDto } from "../types"

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(1, 100),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplierDto) => createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierDto }) => updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useToggleSupplierActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateSupplier(id) : deactivateSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}
