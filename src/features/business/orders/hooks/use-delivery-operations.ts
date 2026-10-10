import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deliveryAction, getDeliveryOperations } from "../services/delivery-operations.service"
import { useAppStore } from "@/store/app-store"

export function useDeliveryOperations(branchId: string | null) {
  return useQuery({
    queryKey: ["delivery-operations", branchId],
    queryFn: ({ signal }) => getDeliveryOperations(branchId, signal),
  })
}

export function useDeliveryAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ path, payload, method }: { path: string; payload?: unknown; method?: "post" | "put" }) =>
      deliveryAction(path, payload, method),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] })
      void qc.invalidateQueries({ queryKey: ["delivery-operations"] })
    },
  })
}

export function useCanManageDeliveries() {
  const session = useAppStore((s) => s.session)
  if (!session) return false
  try {
    const claims = JSON.parse(atob(session.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<
      string,
      unknown
    >
    const role = claims.role ?? claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    return role === "ADMIN" || role === "MANAGER"
  } catch {
    return false
  }
}
