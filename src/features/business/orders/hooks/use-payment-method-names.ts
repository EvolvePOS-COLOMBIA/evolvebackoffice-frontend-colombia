import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"

import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { humanizeCode } from "../utils/closing-summary"

/** Resolves a payment method code to its configured name ("CASH" → "Efectivo"). */
export function usePaymentMethodNames() {
  const { data } = useQuery({
    queryKey: ["payment-methods", "active", "names"],
    queryFn: getActivePaymentMethods,
    staleTime: 5 * 60_000,
  })

  return useCallback(
    (code: string | null | undefined) => {
      if (!code) return "—"
      return data?.find((method) => method.code === code)?.name ?? humanizeCode(code)
    },
    [data]
  )
}
