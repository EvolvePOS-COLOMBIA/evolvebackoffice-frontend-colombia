import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  copyItemImage,
  deleteEntityImage,
  getEntityImages,
  reorderEntityImages,
  setEntityImagePrivacy,
  suggestItemBySku,
  uploadEntityImage,
  type ImageEntity,
} from "../services/item-images.service"
import type { UploadEntityImageDto } from "../types"

const imagesKey = (entity: ImageEntity, id: string) => ["entity-images", entity, id] as const

export function useEntityImages(entity: ImageEntity, id: string) {
  return useQuery({
    queryKey: imagesKey(entity, id),
    queryFn: () => getEntityImages(entity, id),
    enabled: Boolean(id),
  })
}

/** Refresca la galería y los listados (miniaturas y encabezado). */
function useInvalidateImages(entity: ImageEntity, id: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: imagesKey(entity, id) })
    queryClient.invalidateQueries({ queryKey: [entity] })
  }
}

export function useUploadEntityImage(entity: ImageEntity, id: string) {
  const invalidate = useInvalidateImages(entity, id)
  return useMutation({
    mutationFn: (payload: UploadEntityImageDto) => uploadEntityImage(entity, id, payload),
    onSettled: invalidate,
  })
}

export function useSetEntityImagePrivacy(entity: ImageEntity, id: string) {
  const invalidate = useInvalidateImages(entity, id)
  return useMutation({
    mutationFn: ({ imageId, isPrivate }: { imageId: string; isPrivate: boolean }) =>
      setEntityImagePrivacy(entity, id, imageId, isPrivate),
    onSuccess: invalidate,
  })
}

export function useReorderEntityImages(entity: ImageEntity, id: string) {
  const invalidate = useInvalidateImages(entity, id)
  return useMutation({
    mutationFn: (imageIds: string[]) => reorderEntityImages(entity, id, imageIds),
    onSuccess: invalidate,
  })
}

export function useDeleteEntityImage(entity: ImageEntity, id: string) {
  const invalidate = useInvalidateImages(entity, id)
  return useMutation({
    mutationFn: (imageId: string) => deleteEntityImage(entity, id, imageId),
    onSuccess: invalidate,
  })
}

/** Copia a un producto recién creado las imágenes elegidas de una sugerencia. */
export function useCopyItemImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, urls }: { itemId: string; urls: string[] }) => {
      // En orden, para que la primera siga siendo la principal.
      for (const url of urls) await copyItemImage(itemId, url)
    },
    onSettled: (_data, _error, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: imagesKey("items", itemId) })
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

/** Sugerencia por SKU (solo al crear y con un SKU de al menos 4 caracteres). */
export function useItemSuggestion(sku: string, enabled: boolean) {
  const value = sku.trim()
  return useQuery({
    queryKey: ["item-suggestion", value],
    queryFn: () => suggestItemBySku(value),
    enabled: enabled && value.length >= 4,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
