import type { UploadEntityImageDto } from "../types"

/** Formatos que acepta el backend (también verifica la firma del archivo). */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif"
const ALLOWED = IMAGE_ACCEPT.split(",")

/** El backend acepta hasta 2.000.000 bytes; se deja margen. */
const MAX_BYTES = 1_900_000
/** Lado mayor con el que se guardan las fotos grandes (sobra para Cluvi y WooCommerce). */
const MAX_SIDE = 1600

export type PrepareImageError = "unsupported" | "too_large"

export class ImagePrepareError extends Error {
  constructor(public readonly reason: PrepareImageError) {
    super(reason)
  }
}

/**
 * Deja la imagen lista para subir: si ya es liviana se envía tal cual; si no,
 * se reduce a {@link MAX_SIDE} px y se comprime (WebP, o JPEG si el navegador no
 * sabe generar WebP). Los GIF no se tocan para no perder la animación.
 */
export async function prepareImage(file: File): Promise<UploadEntityImageDto> {
  if (!ALLOWED.includes(file.type)) throw new ImagePrepareError("unsupported")

  if (file.type === "image/gif") {
    if (file.size > MAX_BYTES) throw new ImagePrepareError("too_large")
    return { data: await toBase64(file), contentType: file.type, fileName: file.name }
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImagePrepareError("unsupported")
  })
  try {
    if (file.size <= MAX_BYTES && Math.max(bitmap.width, bitmap.height) <= MAX_SIDE * 1.25) {
      return { data: await toBase64(file), contentType: file.type, fileName: file.name }
    }

    for (const [side, quality] of [
      [MAX_SIDE, 0.85],
      [1200, 0.75],
      [900, 0.7],
    ] as const) {
      const blob = await resize(bitmap, side, quality)
      if (blob.size <= MAX_BYTES) {
        return { data: await toBase64(blob), contentType: blob.type, fileName: renamed(file.name, blob.type) }
      }
    }
    throw new ImagePrepareError("too_large")
  } finally {
    bitmap.close()
  }
}

async function resize(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new ImagePrepareError("unsupported")
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const webp = await toBlob(canvas, "image/webp", quality)
  if (webp?.type === "image/webp") return webp

  // Sin WebP: JPEG sobre fondo blanco (JPEG no tiene transparencia).
  ctx.globalCompositeOperation = "destination-over"
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const jpeg = await toBlob(canvas, "image/jpeg", quality)
  if (!jpeg) throw new ImagePrepareError("unsupported")
  return jpeg
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new ImagePrepareError("unsupported"))
    reader.readAsDataURL(blob)
  })
}

function renamed(name: string, type: string) {
  const ext = type === "image/webp" ? "webp" : "jpg"
  const base = name.replace(/\.[^.]+$/, "") || "imagen"
  return `${base}.${ext}`.slice(0, 200)
}
