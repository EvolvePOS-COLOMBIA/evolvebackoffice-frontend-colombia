import { api } from "@/config/axios-client"
import type { EntityImageDto, ItemSuggestDto, UploadEntityImageDto } from "../types"

/**
 * Galería de productos y departamentos: /api/{Items|departments}/{id}/images
 * (máx. 5; la primera es la principal).
 */
export type ImageEntity = "items" | "departments"

const basePath = (entity: ImageEntity, id: string) =>
  `${entity === "items" ? "/api/Items" : "/api/departments"}/${id}/images`

export async function getEntityImages(entity: ImageEntity, id: string): Promise<EntityImageDto[]> {
  const { data } = await api.get<EntityImageDto[]>(basePath(entity, id))
  return data
}

export async function uploadEntityImage(
  entity: ImageEntity,
  id: string,
  payload: UploadEntityImageDto
): Promise<EntityImageDto> {
  const { data } = await api.post<EntityImageDto>(basePath(entity, id), payload)
  return data
}

/** Copia una imagen pública de /media (la de una sugerencia) a este producto. */
export async function copyItemImage(itemId: string, url: string): Promise<EntityImageDto> {
  const { data } = await api.post<EntityImageDto>(`${basePath("items", itemId)}/from-url`, { url })
  return data
}

export async function setEntityImagePrivacy(
  entity: ImageEntity,
  id: string,
  imageId: string,
  isPrivate: boolean
): Promise<EntityImageDto> {
  const { data } = await api.put<EntityImageDto>(`${basePath(entity, id)}/${imageId}`, { isPrivate })
  return data
}

/** El primer id de la lista queda como imagen principal. */
export async function reorderEntityImages(
  entity: ImageEntity,
  id: string,
  imageIds: string[]
): Promise<EntityImageDto[]> {
  const { data } = await api.put<EntityImageDto[]>(`${basePath(entity, id)}/order`, { imageIds })
  return data
}

export async function deleteEntityImage(entity: ImageEntity, id: string, imageId: string): Promise<void> {
  await api.delete(`${basePath(entity, id)}/${imageId}`)
}

/** Producto con el mismo SKU en otro negocio (datos + imágenes públicas). */
export async function suggestItemBySku(sku: string): Promise<ItemSuggestDto> {
  const { data } = await api.get<ItemSuggestDto>("/api/Items/suggest", { params: { sku } })
  return data
}
