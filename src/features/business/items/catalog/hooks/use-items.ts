import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { useTranslation } from "@/i18n/use-i18n"
import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from "../services/items.service"
import type { CreateItemDto, ItemListParams, UpdateItemDto } from "../types"

export function useItems(params: ItemListParams = {}) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => getItems(params),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: (payload: CreateItemDto) => createItem(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success(t("toast_item_created", { name: variables.name }))
    },
    onError: () => {
      toast.error(t("toast_error_create"))
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemDto }) =>
      updateItem(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success(t("toast_item_updated", { name: variables.payload.name }))
    },
    onError: () => {
      toast.error(t("toast_error_update"))
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteItem(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success(t("toast_item_deleted", { name: variables.name }))
    },
    onError: () => {
      toast.error(t("toast_error_delete"))
    },
  })
}
