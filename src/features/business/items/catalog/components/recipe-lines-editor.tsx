import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { formatMoney, formatQuantity, unitSymbol } from "@/features/business/inventory/utils/units"
import { useItems } from "../hooks/use-items"
import type { ItemResponseDto } from "../types"

export type RecipeDraftLine = {
  ingredientItemId: string
  name: string
  sku: string | null
  baseUnit: number
  quantity: string
}

type RecipeLinesEditorProps = {
  /** El producto de la receta: no puede ser su propio ingrediente. */
  itemId: string
  lines: RecipeDraftLine[]
  onChange: (lines: RecipeDraftLine[]) => void
  /** Costo por unidad base de cada ingrediente (si se conoce). */
  costByIngredient?: Map<string, number | null>
}

/** Buscar y agregar ingredientes, cambiar la cantidad por tanda y quitarlos. */
export function RecipeLinesEditor({ itemId, lines, onChange, costByIngredient }: RecipeLinesEditorProps) {
  const { t } = useTranslation("business-items-catalog")
  const [search, setSearch] = useState("")

  const { data: searchResults } = useItems({ pageSize: 8, searchField: "all", searchValue: search.trim() || undefined })
  const candidates = search.trim()
    ? (searchResults?.data ?? []).filter(
        (i) => i.id !== itemId && (i.trackInventory || i.hasRecipe) && !lines.some((l) => l.ingredientItemId === i.id)
      )
    : []

  const addIngredient = (ingredient: ItemResponseDto) => {
    onChange([
      ...lines,
      {
        ingredientItemId: ingredient.id,
        name: ingredient.name ?? "",
        sku: ingredient.sku,
        baseUnit: ingredient.baseUnit,
        quantity: "",
      },
    ])
    setSearch("")
  }

  const updateLine = (id: string, quantity: string) =>
    onChange(lines.map((l) => (l.ingredientItemId === id ? { ...l, quantity } : l)))

  const removeLine = (id: string) => onChange(lines.filter((l) => l.ingredientItemId !== id))

  return (
    <>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="receta-buscar-ingrediente"
            placeholder={t("recipe_search_ingredient")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {candidates.length > 0 ? (
          <div className="divide-y rounded-lg border">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addIngredient(c)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
              >
                <span>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.sku ?? ""}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {unitSymbol(c.baseUnit)}
                  <Plus className="size-4" />
                </span>
              </button>
            ))}
          </div>
        ) : search.trim() ? (
          <p className="text-xs text-muted-foreground">{t("recipe_no_candidates")}</p>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("recipe_empty")}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("recipe_ingredient")}</TableHead>
                <TableHead className="w-44">{t("recipe_quantity")}</TableHead>
                <TableHead className="text-right">{t("recipe_cost")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => {
                const unitCost = costByIngredient?.get(l.ingredientItemId)
                const quantity = Number(l.quantity)
                return (
                  <TableRow key={l.ingredientItemId}>
                    <TableCell>
                      <p className="font-medium text-foreground">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.sku ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          aria-label={t("recipe_quantity")}
                          value={l.quantity}
                          onChange={(e) => updateLine(l.ingredientItemId, e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">{unitSymbol(l.baseUnit)}</span>
                      </div>
                      {quantity >= 1000 && l.baseUnit !== 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">= {formatQuantity(quantity, l.baseUnit)}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {unitCost != null && quantity > 0 ? formatMoney(unitCost * quantity) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("recipe_remove_ingredient")}
                        onClick={() => removeLine(l.ingredientItemId)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
