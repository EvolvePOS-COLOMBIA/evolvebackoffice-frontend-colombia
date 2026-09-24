import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getBranchIntegrations,
  createIntegration,
  testConnection,
  syncMenu,
  activateStore,
} from "../services/orders.service"
import type { CreateIntegrationDto, SyncMenuResponse, ActivateStoreResult } from "../types/api"

export const ordersKeys = {
  all: ["orders"] as const,
  list: (page: number, pageSize: number, filters?: Record<string, string>) =>
    ["orders", "list", page, pageSize, filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  integrations: (branchId: string) => ["orders", "integrations", branchId] as const,
}

export function useOrders(
  page: number,
  pageSize: number,
  filters?: { branchId?: string; status?: string; platform?: string }
) {
  return useQuery({
    queryKey: ordersKeys.list(page, pageSize, filters as Record<string, string>),
    queryFn: () => getOrders(page, pageSize, filters),
  })
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => getOrderById(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  })
}

export function useBranchIntegrations(branchId: string) {
  return useQuery({
    queryKey: ordersKeys.integrations(branchId),
    queryFn: () => getBranchIntegrations(branchId),
    enabled: !!branchId,
  })
}

export function useCreateIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ branchId, dto }: { branchId: string; dto: CreateIntegrationDto }) =>
      createIntegration(branchId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: ({ branchId, integrationId }: { branchId: string; integrationId: string }) =>
      testConnection(branchId, integrationId),
  })
}

export function useSyncMenu() {
  return useMutation({
    mutationFn: ({ branchId, integrationId }: { branchId: string; integrationId: string }): Promise<SyncMenuResponse> =>
      syncMenu(branchId, integrationId),
  })
}

/** Activa la tienda en Cluvi (incluye webhooks) para aceptar pedidos. */
export function useActivateStore() {
  return useMutation({
    mutationFn: ({
      branchId,
      integrationId,
    }: {
      branchId: string
      integrationId: string
    }): Promise<ActivateStoreResult> => activateStore(branchId, integrationId),
  })
}
