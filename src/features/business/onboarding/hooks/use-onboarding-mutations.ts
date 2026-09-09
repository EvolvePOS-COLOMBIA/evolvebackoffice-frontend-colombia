import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Branch } from "@/features/business/branches/types"

import {
  createFirstBranch,
  saveAdminProfile,
  saveBusinessProfile,
} from "../services/onboarding.service"
import type { AccountStepValues, BranchStepValues, BusinessStepValues } from "../types"

/**
 * Mutaciones del wizard. Cada paso dispara la suya al avanzar, en vez de
 * guardar todo al final: si el usuario abandona a mitad, lo ya guardado queda.
 */

export function useSaveAdminProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      userId: string
      values: AccountStepValues
    }) => {
      await saveAdminProfile(input.userId, input.values)
      return { passwordChanged: false, userId: input.userId }
    },
    onSuccess: (result) => {
      // Invalidate user query to refresh backend data
      queryClient.invalidateQueries({ queryKey: ["users", result.userId] })
    },
  })
}

export function useSaveBusinessProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: BusinessStepValues) => saveBusinessProfile(values),
    onSuccess: () => {
      // Invalidate tenant settings query to refresh backend data
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] })
    },
  })
}

export function useCreateFirstBranch() {
  return useMutation<Branch, Error, { values: BranchStepValues; adminUserId: string }>({
    mutationFn: (input) => createFirstBranch(input.values, input.adminUserId),
  })
}
