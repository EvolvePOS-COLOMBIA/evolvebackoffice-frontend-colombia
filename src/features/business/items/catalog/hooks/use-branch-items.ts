import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  adjustBranchItemStock,
  createBranchItem,
  deleteBranchItem,
  getBranchItems,
  updateBranchItemPricing,
} from "../services/branch-items.service"
import type {
  AdjustBranchItemStockDto,
  CreateBranchItemDto,
  ItemListParams,
  UpdateBranchItemDto,
} from "../types"

export function useBranchItems(branchId: string | null, params: ItemListParams = {}) {
  return useQuery({
    queryKey: ["branch-items", branchId, params],
    queryFn: () => getBranchItems(branchId!, params),
    enabled: Boolean(branchId),
  })
}

export function useCreateBranchItem(branchId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBranchItemDto) => {
      if (!branchId) return Promise.reject(new Error("No branch selected"))
      return createBranchItem(branchId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
    },
  })
}

export function useUpdateBranchItemPricing(branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchItemDto }) =>
      updateBranchItemPricing(branchId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
    },
  })
}

export function useAdjustBranchItemStock(branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustBranchItemStockDto }) =>
      adjustBranchItemStock(branchId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
    },
  })
}

export function useDeleteBranchItem(branchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBranchItem(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", branchId] })
    },
  })
}
