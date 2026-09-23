import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../services/customers.service"
import type { CreateCustomerDto, UpdateCustomerDto } from "../types"

export function useCustomers(page: number, pageSize: number, search: string) {
  return useQuery({
    queryKey: ["customers", page, pageSize, search],
    queryFn: () =>
      getCustomers({
        pageNumber: page,
        pageSize,
        ...(search ? { searchField: "name", searchValue: search } : {}),
      }),
  })
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
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

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
