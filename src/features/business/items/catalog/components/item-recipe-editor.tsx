import { useState } from "react"
import { Save, Trash2 } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useDeleteRecipe, useRecipe, useSaveRecipe } from "@/features/business/inventory/hooks/use-inventory"
import { useInventoryBranch } from "@/features/business/inventory/hooks/use-inventory-branch"
import type { RecipeDto } from "@/features/business/inventory/types"
import { formatMoney, formatUnitCost, unitSymbol } from "@/features/business/inventory/utils/units"
import type { ItemResponseDto } from "../types"
import { BranchSelector } from "./branch-selector"
import { RecipeLinesEditor, type RecipeDraftLine } from "./recipe-lines-editor"

type ItemRecipeEditorProps = {
  item: ItemResponseDto
}

type Draft = { yieldQuantity: string; notes: string; lines: RecipeDraftLine[] }

function toDraftLines(recipe: RecipeDto | null | undefined): RecipeDraftLine[] {
  return (recipe?.lines ?? []).map((l) => ({
    ingredientItemId: l.ingredientItemId,
    name: l.ingredientName,
    sku: l.ingredientSku,
    baseUnit: l.baseUnit,
    quantity: String(l.quantity),
  }))
}

function toDraft(recipe: RecipeDto | null | undefined): Draft {
  if (!recipe) return { yieldQuantity: "1", notes: "", lines: [] }
  return {
    yieldQuantity: String(recipe.yieldQuantity),
    notes: recipe.notes ?? "",
    lines: toDraftLines(recipe),
  }
}

/**
 * Receta (ficha técnica) del producto: ingredientes por tanda y cuánto rinde.
 * Plato de menú → se descuenta al vender. Semielaborado → se usa al producir.
 */
export function ItemRecipeEditor({ item }: ItemRecipeEditorProps) {
  const { t } = useTranslation("business-items-catalog")
  const { branches, branchId, selectBranch } = useInventoryBranch()
  const recipeQuery = useRecipe(item.id, branchId)
  const saveRecipe = useSaveRecipe(item.id)
  const deleteRecipe = useDeleteRecipe(item.id)

  const [draft, setDraft] = useState<Draft>(() => toDraft(null))
  const [loadedKey, setLoadedKey] = useState<string | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // La receta del servidor se toma como borrador cuando cambia la receta, no cuando solo cambian
  // los costos al elegir otra sucursal: así no se pierden los cambios sin guardar.
  const serverDraft = recipeQuery.data !== undefined ? toDraft(recipeQuery.data) : undefined
  const serverKey = serverDraft ? JSON.stringify(serverDraft) : undefined
  if (serverDraft && serverKey !== loadedKey) {
    setLoadedKey(serverKey)
    setDraft(serverDraft)
  }

  const recipe = recipeQuery.data ?? null
  const costByIngredient = new Map(recipe?.lines.map((l) => [l.ingredientItemId, l.unitCost]) ?? [])
  const yieldNumber = Number(draft.yieldQuantity)
  const linesValid = draft.lines.length > 0 && draft.lines.every((l) => Number(l.quantity) > 0)
  const canSave = yieldNumber > 0 && linesValid && !saveRecipe.isPending

  const handleSave = () => {
    if (!canSave) return
    saveRecipe.mutate(
      {
        yieldQuantity: yieldNumber,
        notes: draft.notes.trim() || null,
        lines: draft.lines.map((l) => ({ ingredientItemId: l.ingredientItemId, quantity: Number(l.quantity) })),
      },
      {
        onSuccess: () => notify.success(t("recipe_saved")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("recipe_error"))),
      }
    )
  }

  const handleDelete = () =>
    deleteRecipe.mutate(undefined, {
      onSuccess: () => {
        setConfirmDelete(false)
        notify.success(t("recipe_deleted"))
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("recipe_error"))),
    })

  if (recipeQuery.isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {item.trackInventory ? t("recipe_desc_produced") : t("recipe_desc_sold")}
      </p>

      <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          <Label htmlFor="receta-rinde">{t("recipe_yield", { unit: unitSymbol(item.baseUnit) })}</Label>
          <Input
            id="receta-rinde"
            type="number"
            min={0}
            step="any"
            value={draft.yieldQuantity}
            onChange={(e) => setDraft((d) => ({ ...d, yieldQuantity: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{t("recipe_yield_hint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="receta-notas">{t("recipe_notes")}</Label>
          <Textarea
            id="receta-notas"
            rows={3}
            maxLength={1000}
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </div>
      </div>

      <RecipeLinesEditor
        itemId={item.id}
        lines={draft.lines}
        onChange={(lines) => setDraft((d) => ({ ...d, lines }))}
        costByIngredient={costByIngredient}
      />

      {recipe && branches.length > 0 ? (
        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{t("recipe_cost_in_branch")}</p>
            <BranchSelector
              options={branches.map((b) => ({ id: b.id, name: b.name }))}
              selectedId={branchId}
              onSelect={(id) => id && selectBranch(id)}
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              {t("recipe_batch_cost")}:{" "}
              <span className="font-medium text-foreground">{formatMoney(recipe.batchCost ?? 0)}</span>
            </span>
            <span className="text-muted-foreground">
              {t("recipe_unit_cost", { unit: unitSymbol(item.baseUnit) })}:{" "}
              <span className="font-medium text-foreground">{formatUnitCost(recipe.unitCost ?? 0)}</span>
            </span>
          </div>
          {recipe.warnings.map((w) => (
            <Badge key={w} tone="warning">
              {w}
            </Badge>
          ))}
          <p className="text-xs text-muted-foreground">{t("recipe_cost_hint")}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {recipe ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteRecipe.isPending}
          >
            <Trash2 className="mr-2 size-4" />
            {t("recipe_delete")}
          </Button>
        ) : null}
        <Button id="btn-guardar-receta" type="button" onClick={handleSave} disabled={!canSave}>
          <Save className="mr-2 size-4" />
          {saveRecipe.isPending ? t("saving") : t("recipe_save")}
        </Button>
      </div>

      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("recipe_delete_title")}
        description={item.trackInventory ? t("recipe_delete_desc_produced") : t("recipe_delete_desc")}
        confirmLabel={t("recipe_delete")}
        tone="destructive"
        isPending={deleteRecipe.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
