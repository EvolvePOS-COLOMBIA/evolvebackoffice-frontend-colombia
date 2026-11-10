import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  activatePersonCredit,
  getCreditHistory,
  getPendingAuthorizations,
  getPersonCredit,
  resendCreditPin,
} from "../services/credit.service"

export function usePersonCredit(personId: string | null) {
  return useQuery({
    queryKey: ["person-credit", personId],
    queryFn: () => getPersonCredit(personId!),
    enabled: !!personId,
  })
}

export function useCreditHistory(personId: string | null, pageSize = 10) {
  return useQuery({
    queryKey: ["person-credit-history", personId, pageSize],
    queryFn: () => getCreditHistory(personId!, 1, pageSize),
    enabled: !!personId,
  })
}

export function useActivateCredit(personId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (creditLimit: number) => activatePersonCredit(personId!, creditLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-credit", personId] })
      queryClient.invalidateQueries({ queryKey: ["person-credit-history", personId] })
    },
  })
}

export function useResendCreditPin(personId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => resendCreditPin(personId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-credit", personId] })
    },
  })
}

/** Autorizaciones pendientes de liquidar (panel administrativo — F5). */
export function usePendingAuthorizations(enabled = true) {
  return useQuery({
    queryKey: ["credit-pending-authorizations"],
    queryFn: getPendingAuthorizations,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  })
}
