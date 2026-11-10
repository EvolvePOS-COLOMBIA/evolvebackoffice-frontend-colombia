import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activateCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomers,
  updateCustomer,
} from "../services/customers.service"
import type { CreateCustomerDto, UpdateCustomerDto } from "../types"

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(1, 100),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCustomerDto) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerDto }) => updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useToggleCustomerActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateCustomer(id) : deactivateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
