import { useState } from "react"
import { CopyPlus, Pencil } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RecipeLinesEditor,
  type RecipeDraftLine,
} from "@/features/business/items/catalog/components/recipe-lines-editor"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useCopyItemWithRecipe, useRecipe } from "../../hooks/use-inventory"
import type { RecipeDto } from "../../types"
import type { ProducibleItemDto } from "../../types/production"
import { formatQuantity } from "../../utils/units"

type RecipeChangeDialogProps = {
  branchId: string
  product: ProducibleItemDto
  onOpenChange: (open: boolean) => void
  /** El producto nuevo, listo para producir en lugar del original. */
  onCreated: (product: ProducibleItemDto) => void
}

const toLines = (recipe: RecipeDto | null): RecipeDraftLine[] =>
  (recipe?.lines ?? []).map((l) => ({
    ingredientItemId: l.ingredientItemId,
    name: l.ingredientName,
    sku: l.ingredientSku,
    baseUnit: l.baseUnit,
    quantity: String(l.quantity),
  }))

/**
 * Agregar o quitar ingredientes al producir. El original no se toca: al aceptar se crea un
 * producto nuevo, copia exacta del original, con esta receta.
 */
export function RecipeChangeDialog({ branchId, product, onOpenChange, onCreated }: RecipeChangeDialogProps) {
  const { t } = useTranslation("business-inventory")
  const recipeQuery = useRecipe(product.itemId, branchId)
  const copy = useCopyItemWithRecipe(product.itemId)

  const [lines, setLines] = useState<RecipeDraftLine[]>([])
  const [loadedFrom, setLoadedFrom] = useState<RecipeDto | null | undefined>(undefined)
  const [name, setName] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  // La receta del servidor es el punto de partida.
  if (recipeQuery.data !== undefined && recipeQuery.data !== loadedFrom) {
    setLoadedFrom(recipeQuery.data)
    setLines(toLines(recipeQuery.data))
  }

  const original = recipeQuery.data ?? null
  const before = toLines(original)
  const added = lines.filter((l) => !before.some((b) => b.ingredientItemId === l.ingredientItemId))
  const removed = before.filter((b) => !lines.some((l) => l.ingredientItemId === b.ingredientItemId))
  const quantityChanged = lines.some((l) =>
    before.some((b) => b.ingredientItemId === l.ingredientItemId && Number(b.quantity) !== Number(l.quantity))
  )
  const changed = added.length > 0 || removed.length > 0 || quantityChanged

  // Nombre sugerido: dice qué cambió ("PAN DE PAPA CON HARINA DE TRIGO").
  const parts = [
    added.length > 0 ? t("production_variant_with", { names: added.map((l) => l.name).join(", ") }) : null,
    removed.length > 0 ? t("production_variant_without", { names: removed.map((l) => l.name).join(", ") }) : null,
  ].filter(Boolean)
  const suggested =
    `${product.itemName} ${parts.length > 0 ? parts.join(" ") : t("production_variant_other")}`.toUpperCase()
  const newName = (name ?? suggested).trim()

  const linesValid = lines.length > 0 && lines.every((l) => Number(l.quantity) > 0)
  const canAccept = changed && linesValid && newName.length > 0 && !copy.isPending
  const costByIngredient = new Map(original?.lines.map((l) => [l.ingredientItemId, l.unitCost]) ?? [])

  const create = () =>
    copy.mutate(
      {
        name: newName,
        recipe: {
          yieldQuantity: original?.yieldQuantity ?? product.yieldQuantity,
          notes: original?.notes ?? null,
          lines: lines.map((l) => ({ ingredientItemId: l.ingredientItemId, quantity: Number(l.quantity) })),
        },
      },
      {
        onSuccess: (recipe) => {
          notify.success(t("production_variant_created", { name: recipe.itemName }))
          onCreated({
            itemId: recipe.itemId,
            itemName: recipe.itemName,
            sku: null,
            baseUnit: recipe.baseUnit,
            yieldQuantity: recipe.yieldQuantity,
            onHand: 0,
            unitCost: recipe.unitCost ?? 0,
          })
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("production_variant_title", { name: product.itemName })}</DialogTitle>
              <DialogDescription>{t("production_variant_desc", { name: product.itemName })}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {recipeQuery.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("production_variant_batch", {
                quantity: formatQuantity(original?.yieldQuantity ?? product.yieldQuantity, product.baseUnit),
              })}
            </p>
            <RecipeLinesEditor
              itemId={product.itemId}
              lines={lines}
              onChange={setLines}
              costByIngredient={costByIngredient}
            />
            {changed ? (
              <div className="space-y-2 rounded-xl border border-border/70 p-3">
                <Label htmlFor="variante-nombre">{t("production_variant_name")}</Label>
                <Input
                  id="variante-nombre"
                  maxLength={200}
                  value={name ?? suggested}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("production_variant_name_hint", { name: product.itemName })}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("production_variant_unchanged")}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button id="btn-aceptar-receta" type="button" disabled={!canAccept} onClick={() => setConfirm(true)}>
            <CopyPlus className="mr-2 size-4" />
            {t("production_variant_accept")}
          </Button>
        </DialogFooter>

        <ConfirmActionDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("production_variant_confirm_title")}
          description={t("production_variant_confirm_desc", {
            name: newName.toUpperCase(),
            original: product.itemName,
          })}
          confirmLabel={t("production_variant_confirm")}
          tone="default"
          isPending={copy.isPending}
          onConfirm={create}
        />
      </DialogContent>
    </Dialog>
  )
}
