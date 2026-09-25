import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { useTranslation } from "@/i18n/use-i18n"
import { activateItem, createItem, deleteItem, getItems, updateItem } from "../services/items.service"
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemDto }) => updateItem(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success(t("toast_item_updated", { name: variables.payload.name }))
    },
    onError: () => {
      toast.error(t("toast_error_update"))
    },
  })
}

/**
 * Activa o desactiva (soft-delete) un producto desde el catálogo general.
 * Desactivar lo oculta de la venta en todas las sucursales; con
 * includeInactive el producto sigue listado con su badge y puede reactivarse.
 */
export function useSetItemActive() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-catalog")

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean; name: string }) =>
      active ? activateItem(id) : deleteItem(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success(variables.active ? t("toast_item_activated") : t("toast_item_deactivated"))
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
