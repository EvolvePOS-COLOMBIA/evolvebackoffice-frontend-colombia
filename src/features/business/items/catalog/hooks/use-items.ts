import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

  return useMutation({
    mutationFn: (payload: CreateItemDto) => createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemDto }) =>
      updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
