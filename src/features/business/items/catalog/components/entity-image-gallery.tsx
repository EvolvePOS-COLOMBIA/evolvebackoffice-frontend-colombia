import { useRef, useState, type DragEvent, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Globe, ImagePlus, Loader2, Lock, Star, Trash2 } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import {
  useDeleteEntityImage,
  useEntityImages,
  useReorderEntityImages,
  useSetEntityImagePrivacy,
  useUploadEntityImage,
} from "../hooks/use-item-images"
import type { ImageEntity } from "../services/item-images.service"
import { IMAGE_ACCEPT, ImagePrepareError, prepareImage } from "../utils/prepare-image"
import type { EntityImageDto } from "../types"

/** Lo mismo que valida el backend (EntityImage.MaxImages). */
export const MAX_IMAGES = 5

/** Textos que en departamentos usan su variante "_department". */
const DEPARTMENT_KEYS = new Set(["images_desc", "images_delete_desc", "images_main_desc", "images_limit"])

type EntityImageGalleryProps = {
  entity: ImageEntity
  entityId: string
  name: string
  /** Columnas de la cuadrícula (en un diálogo caben menos que en una página). */
  gridClassName?: string
  /** Título de la sección; con él, el contador va a su lado (útil en espacios angostos). */
  title?: string
}

/**
 * Galería de un producto o departamento: hasta 5 fotos; la primera es la
 * principal (la única que recibe Cluvi; WooCommerce recibe todas). Solo las de
 * productos se ofrecen a otros negocios por SKU, por eso solo ellas pueden ser privadas.
 */
export function EntityImageGallery({
  entity,
  entityId,
  name,
  gridClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  title,
}: EntityImageGalleryProps) {
  const { t: translate } = useTranslation("business-items-catalog")
  const t = (key: string, options?: Record<string, unknown>) =>
    translate(entity === "departments" && DEPARTMENT_KEYS.has(key) ? `${key}_department` : key, options)
  const withPrivacy = entity === "items"

  const imagesQuery = useEntityImages(entity, entityId)
  const upload = useUploadEntityImage(entity, entityId)
  const reorder = useReorderEntityImages(entity, entityId)
  const privacy = useSetEntityImagePrivacy(entity, entityId)
  const remove = useDeleteEntityImage(entity, entityId)

  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<EntityImageDto | null>(null)
  const [toDelete, setToDelete] = useState<EntityImageDto | null>(null)

  const images = imagesQuery.data ?? []
  const free = MAX_IMAGES - images.length - uploading
  const busy = uploading > 0 || reorder.isPending
  const count = t("images_count", { count: images.length, max: MAX_IMAGES })

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    const accepted = list.slice(0, Math.max(0, free))
    if (accepted.length < list.length) notify.info(t("images_limit", { max: MAX_IMAGES }))
    if (accepted.length === 0) return

    setUploading((n) => n + accepted.length)
    // Una por una para conservar el orden en que se eligieron.
    for (const file of accepted) {
      try {
        const payload = await prepareImage(file)
        await upload.mutateAsync(payload)
      } catch (error) {
        const message =
          error instanceof ImagePrepareError
            ? t(`images_error_${error.reason}`, { name: file.name })
            : getApiErrorMessage(error, t("images_error_upload"))
        notify.error(message)
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const move = (index: number, to: number) => {
    const ids = images.map((i) => i.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(to, 0, moved)
    reorder.mutate(ids, {
      onSuccess: () => {
        if (to === 0) notify.success(t("images_main_set"))
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("images_error"))),
    })
  }

  const togglePrivacy = (image: EntityImageDto) => {
    privacy.mutate(
      { imageId: image.id, isPrivate: !image.isPrivate },
      {
        onSuccess: (updated) => notify.success(updated.isPrivate ? t("images_made_private") : t("images_made_public")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("images_error"))),
      }
    )
  }

  const confirmDelete = () => {
    if (!toDelete) return
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        notify.success(t("images_deleted"))
        setToDelete(null)
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("images_error"))),
    })
  }

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (free > 0) void handleFiles(e.dataTransfer.files)
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {title ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <span className="shrink-0 text-sm font-medium text-foreground">{count}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("images_desc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("images_desc")}</p>
            <span className="shrink-0 text-sm font-medium text-foreground">{count}</span>
          </div>
        )}

        <input
          ref={fileInput}
          id={`${entity}-imagenes-archivo`}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files)
            e.target.value = ""
          }}
        />

        {imagesQuery.isLoading ? (
          <div className={cn("grid gap-3", gridClassName)}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : imagesQuery.isError && !imagesQuery.data ? (
          // Sin la galería no se sabe cuántas hay: no se ofrece agregar.
          <p className="text-sm text-destructive">{t("images_load_error")}</p>
        ) : (
          <div
            className={cn("grid gap-3", gridClassName)}
            onDragOver={(e) => {
              e.preventDefault()
              if (free > 0) setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {images.map((image, index) => (
              <div key={image.id} className="flex flex-col overflow-hidden rounded-lg border bg-card">
                <button
                  type="button"
                  className="relative aspect-square w-full cursor-zoom-in bg-muted/40"
                  onClick={() => setPreview(image)}
                  aria-label={t("images_open", { position: index + 1 })}
                >
                  <img
                    src={image.url}
                    alt={t("images_alt", { name, position: index + 1 })}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  <span className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {index === 0 ? (
                      <Badge tone="primary" className="bg-background/90">
                        {t("images_main")}
                      </Badge>
                    ) : null}
                    {withPrivacy && image.isPrivate ? (
                      <Badge tone="neutral" className="bg-background/90">
                        {t("images_private")}
                      </Badge>
                    ) : null}
                  </span>
                </button>

                <div className="flex items-center justify-between gap-1 border-t px-1 py-1">
                  <div className="flex items-center">
                    <IconAction
                      label={t("images_move_left")}
                      disabled={busy || index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </IconAction>
                    <IconAction
                      label={t("images_move_right")}
                      disabled={busy || index === images.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </IconAction>
                  </div>
                  <div className="flex items-center">
                    {index > 0 ? (
                      <IconAction label={t("images_make_main")} disabled={busy} onClick={() => move(index, 0)}>
                        <Star className="size-4" />
                      </IconAction>
                    ) : null}
                    {withPrivacy ? (
                      <IconAction
                        label={image.isPrivate ? t("images_make_public") : t("images_make_private")}
                        disabled={privacy.isPending}
                        onClick={() => togglePrivacy(image)}
                      >
                        {image.isPrivate ? <Lock className="size-4" /> : <Globe className="size-4" />}
                      </IconAction>
                    ) : null}
                    <IconAction label={t("images_delete")} onClick={() => setToDelete(image)}>
                      <Trash2 className="size-4" />
                    </IconAction>
                  </div>
                </div>
              </div>
            ))}

            {Array.from({ length: uploading }).map((_, i) => (
              <div
                key={`subiendo-${i}`}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border bg-muted/40 text-sm text-muted-foreground"
              >
                <Loader2 className="size-5 animate-spin" />
                {t("images_uploading")}
              </div>
            ))}

            {free > 0 ? (
              <button
                id={`btn-agregar-imagen-${entity}`}
                type="button"
                onClick={() => fileInput.current?.click()}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-center text-sm transition-colors hover:border-primary hover:text-primary ${
                  dragOver ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
                }`}
              >
                <ImagePlus className="size-6" />
                <span className="font-medium">{t("images_add")}</span>
                <span className="text-xs">{t("images_add_hint")}</span>
              </button>
            ) : null}
          </div>
        )}

        {withPrivacy ? <p className="text-xs leading-5 text-muted-foreground">{t("images_privacy_hint")}</p> : null}

        <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>
                {preview && images[0]?.id === preview.id ? t("images_main_desc") : t("images_preview_desc")}
              </DialogDescription>
            </DialogHeader>
            {preview ? (
              <img src={preview.url} alt={name} className="max-h-[70vh] w-full rounded-lg object-contain" />
            ) : null}
          </DialogContent>
        </Dialog>

        <ConfirmActionDialog
          open={toDelete !== null}
          onOpenChange={(open) => !open && setToDelete(null)}
          title={t("images_delete_title")}
          description={t("images_delete_desc")}
          confirmLabel={t("images_delete")}
          isPending={remove.isPending}
          onConfirm={confirmDelete}
        />
      </div>
    </TooltipProvider>
  )
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
