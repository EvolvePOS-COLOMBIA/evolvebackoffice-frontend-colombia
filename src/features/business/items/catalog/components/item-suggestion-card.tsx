import { useEffect, useState } from "react"
import { Check, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { useItemSuggestion } from "../hooks/use-item-images"
import type { ItemSuggestDto } from "../types"
import { ItemThumbnail } from "./item-thumbnail"

type ItemSuggestionCardProps = {
  sku: string
  /** Se aplicó la sugerencia: datos para el formulario e imágenes a copiar al crear. */
  onApply: (suggestion: ItemSuggestDto) => void
  /** Se descartó: ya no se copian sus imágenes. */
  onDismiss: () => void
  /** Imágenes que se copiarán al crear (0 = aún no se aplicó). */
  appliedImages: number
}

/**
 * Al crear un producto, busca el mismo SKU en otros negocios y ofrece usar sus
 * datos y sus imágenes públicas (código de barras de un producto de marca).
 */
export function ItemSuggestionCard({ sku, onApply, onDismiss, appliedImages }: ItemSuggestionCardProps) {
  const { t } = useTranslation("business-items-catalog")
  const [debouncedSku, setDebouncedSku] = useState(sku)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [applied, setApplied] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSku(sku.trim()), 500)
    return () => clearTimeout(timer)
  }, [sku])

  const { data } = useItemSuggestion(debouncedSku, dismissed !== debouncedSku)
  if (!data?.found || dismissed === debouncedSku || data.sku?.toLowerCase() !== debouncedSku.toLowerCase()) return null

  const images = data.images ?? []
  const isApplied = applied === debouncedSku

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ItemThumbnail url={images[0]?.url} alt={data.name ?? ""} className="size-14" />
        <div className="min-w-0 space-y-0.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            {t("suggest_found")}
          </p>
          <p className="truncate font-medium text-foreground">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {isApplied
              ? appliedImages > 0
                ? t("suggest_applied_images", { count: appliedImages })
                : t("suggest_applied")
              : images.length > 0
                ? t("suggest_desc_images", { count: images.length })
                : t("suggest_desc")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isApplied ? (
          <span className="flex items-center gap-1 text-sm font-medium text-primary">
            <Check className="size-4" aria-hidden />
            {t("suggest_applied_short")}
          </span>
        ) : (
          <Button
            id="btn-usar-sugerencia"
            type="button"
            size="sm"
            // Mientras se actualiza el SKU escrito, la sugerencia es del anterior.
            disabled={sku.trim() !== debouncedSku}
            onClick={() => {
              setApplied(debouncedSku)
              onApply(data)
            }}
          >
            {t("suggest_apply")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("suggest_dismiss")}
          onClick={() => {
            setDismissed(debouncedSku)
            onDismiss()
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
