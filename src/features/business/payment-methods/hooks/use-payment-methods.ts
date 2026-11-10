import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createPaymentMethod,
  getAllPaymentMethods,
  restoreCountryDefaults,
  setActivePaymentMethod,
  updatePaymentMethod,
} from "../services/payment-methods.service"
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from "../types"

export function useAllPaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods", "all"],
    queryFn: getAllPaymentMethods,
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePaymentMethodDto) => createPaymentMethod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentMethodDto }) => updatePaymentMethod(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })
}

export function useSetActivePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setActivePaymentMethod(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })
}

export function useRestoreCountryDefaults() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (countryCode?: string) => restoreCountryDefaults(countryCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })
}
