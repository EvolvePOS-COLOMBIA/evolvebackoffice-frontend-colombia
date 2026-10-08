import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getBranchIntegrations,
  createIntegration,
  updateIntegration,
  testConnection,
  syncMenu,
  activateStore,
  createManualOrder,
  updateOrderDetails,
} from "../services/orders.service"
import type {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  SyncMenuResponse,
  ActivateStoreResult,
  CreateManualOrderDto,
  UpdateOrderDetailsDto,
} from "../types/api"

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
  filters?: { branchId?: string; status?: string; platform?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ordersKeys.list(page, pageSize, filters as Record<string, string>),
    queryFn: () => getOrders(page, pageSize, filters),
    enabled,
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
    mutationFn: ({ id, status, courierId }: { id: string; status: string; courierId?: string | null }) =>
      updateOrderStatus(id, status, courierId),
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

/** Actualiza una integración existente (siempre que ya exista por sucursal+plataforma). */
export function useUpdateIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      branchId,
      integrationId,
      dto,
    }: {
      branchId: string
      integrationId: string
      dto: UpdateIntegrationDto
    }) => updateIntegration(branchId, integrationId, dto),
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

/**
 * Crea una orden manual (venta de caja / domicilio). Refresca la lista de
 * órdenes; el toast de éxito/error lo dispara el formulario.
 */
export function useCreateManualOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateManualOrderDto) => createManualOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}

/**
 * Actualiza detalles de una orden (notas, dirección, costo de envío).
 * Refresca lista y detalle; el toast lo dispara el formulario.
 */
export function useUpdateOrderDetails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderDetailsDto }) => updateOrderDetails(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}
