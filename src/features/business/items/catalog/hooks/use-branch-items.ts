import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { useTranslation } from "@/i18n/use-i18n"
import {
  adjustBranchItemStock,
  createBranchItem,
  deleteBranchItem,
  getBranchItems,
  updateBranchItemConfig,
  updateBranchItemPricing,
} from "../services/branch-items.service"
import type { AdjustBranchItemStockDto, CreateBranchItemDto, ItemListParams, UpdateBranchItemDto } from "../types"

export function useBranchItems(branchId: string | null, params: ItemListParams = {}) {
  return useQuery({
    queryKey: ["branch-items", branchId, params],
    queryFn: () => getBranchItems(branchId!, params),
    enabled: Boolean(branchId),
  })
}

export function useCreateBranchItem(branchId: string | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: (payload: CreateBranchItemDto) => {
      if (!branchId) return Promise.reject(new Error("No branch selected"))
      return createBranchItem(branchId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
      toast.success(t("toast_item_assigned"))
    },
    onError: () => {
      toast.error(t("toast_error_assign"))
    },
  })
}

export function useUpdateBranchItemPricing(branchId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchItemDto }) =>
      updateBranchItemPricing(branchId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
      toast.success(t("toast_pricing_updated"))
    },
    onError: () => {
      toast.error(t("toast_error_pricing"))
    },
  })
}

export function useAdjustBranchItemStock(branchId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustBranchItemStockDto }) =>
      adjustBranchItemStock(branchId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
      toast.success(t("toast_stock_adjusted"))
    },
    onError: () => {
      toast.error(t("toast_error_stock"))
    },
  })
}

/**
 * Cambia el modo de configuración (global vs personalizada) de impuestos/modificadores
 * del ítem en la sucursal. Refresca los ítems de la sucursal porque cambian los flags.
 */
export function useUpdateBranchItemConfig(branchId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { useGlobalTaxes?: boolean; useGlobalModifiers?: boolean }
    }) => updateBranchItemConfig(branchId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] })
      queryClient.invalidateQueries({ queryKey: ["item-modifiers"] })
      toast.success(t("toast_config_saved"))
    },
    onError: () => {
      toast.error(t("toast_error_config"))
    },
  })
}

export function useDeleteBranchItem(branchId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteBranchItem(branchId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
      toast.success(t("toast_item_removed_from_branch", { name: variables.name }))
    },
    onError: () => {
      toast.error(t("toast_error_remove"))
    },
  })
}
