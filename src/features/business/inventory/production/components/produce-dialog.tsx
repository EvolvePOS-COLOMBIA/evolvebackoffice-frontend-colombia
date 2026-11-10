import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { keepPreviousData, useQueries } from "@tanstack/react-query"
import { AlertTriangle, CalendarClock, ChefHat, Pencil, Plus, Trash2 } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Branch } from "@/features/business/branches/types"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useCompleteProduction, useCreateProduction, useProducibleItems } from "../../hooks/use-production"
import { getProductionPreview } from "../../services/production.service"
import type { ProducibleItemDto, ProductionOrderDto, ProductionPreviewDto } from "../../types/production"
import { isNonNegative } from "../../utils/lines"
import { formatMoney, formatQuantity, formatUnitCost, unitSymbol } from "../../utils/units"
import { RecipeChangeDialog } from "./recipe-change-dialog"

type ProduceDialogProps = {
  branch: Branch
  /** "plan" solo deja la orden preparada (no mueve inventario). */
  mode: "produce" | "plan"
  /** Registrar una orden que estaba preparada. */
  fromPlan?: ProductionOrderDto
  onOpenChange: (open: boolean) => void
  onDone: (order: ProductionOrderDto) => void
}

/** Un producto de la orden: qué, cuánto se va a hacer, cuánto salió y lo que se gastó de verdad. */
type Row = {
  key: number
  itemId: string | null
  planned: string
  produced: string
  actuals: Record<string, string>
}

type Shortage = { itemId: string; itemName: string; baseUnit: number; missing: number }

let nextKey = 1
const emptyRow = (): Row => ({ key: nextKey++, itemId: null, planned: "", produced: "", actuals: {} })

/** Productos (uno o varios) → cuánto → ingredientes que se gastan → ¿cuánto salió? → Registrar. */
export function ProduceDialog({ branch, mode, fromPlan, onOpenChange, onDone }: ProduceDialogProps) {
  const { t } = useTranslation("business-inventory")
  const navigate = useNavigate()
  const { data: producible = [], isLoading: productsLoading } = useProducibleItems(fromPlan ? null : branch.id)
  const create = useCreateProduction()
  const complete = useCompleteProduction()

  const [rows, setRows] = useState<Row[]>(() =>
    fromPlan
      ? fromPlan.products.map((p) => ({
          key: nextKey++,
          itemId: p.itemId,
          planned: String(p.plannedQuantity),
          produced: String(p.plannedQuantity),
          actuals: {},
        }))
      : [emptyRow()]
  )
  // Productos creados aquí al cambiar la receta (todavía no llegan en la lista).
  const [created, setCreated] = useState<ProducibleItemDto[]>([])
  const [changing, setChanging] = useState<{ rowKey: number; product: ProducibleItemDto } | null>(null)
  const [adjust, setAdjust] = useState(false)
  const [notes, setNotes] = useState(fromPlan?.notes ?? "")

  const isPlan = mode === "plan"
  const pending = create.isPending || complete.isPending
  const products = [...producible, ...created.filter((c) => !producible.some((p) => p.itemId === c.itemId))]

  const previews = useQueries({
    queries: rows.map((r) => {
      const quantity = Number(r.planned) || 0
      return {
        queryKey: ["production-preview", branch.id, r.itemId, quantity],
        queryFn: () => getProductionPreview(branch.id, r.itemId!, quantity),
        enabled: Boolean(r.itemId) && quantity > 0,
        placeholderData: keepPreviousData,
      }
    }),
  })

  const infoFor = (row: Row) => {
    const plan = fromPlan?.products.find((p) => p.itemId === row.itemId)
    const product = products.find((p) => p.itemId === row.itemId)
    return {
      product,
      itemName: plan?.itemName ?? product?.itemName ?? "",
      baseUnit: plan?.baseUnit ?? product?.baseUnit ?? 0,
    }
  }

  // Con "Ajustar lo gastado" se descuenta lo escrito; si no, lo que dice la receta.
  const actualFor = (row: Row, id: string, required: number) =>
    adjust && row.actuals[id] !== undefined ? Number(row.actuals[id]) : required

  // Lo que se gasta de cada ingrediente sumando todos los productos de la orden.
  const totals = new Map<string, { itemName: string; baseUnit: number; onHand: number; used: number }>()
  rows.forEach((row, index) => {
    for (const i of previews[index]?.data?.ingredients ?? []) {
      const current = totals.get(i.itemId) ?? { itemName: i.itemName, baseUnit: i.baseUnit, onHand: i.onHand, used: 0 }
      current.used += actualFor(row, i.itemId, i.required)
      totals.set(i.itemId, current)
    }
  })
  const shortages: Shortage[] = [...totals.entries()]
    .filter(([, v]) => v.used > Math.max(0, v.onHand))
    .map(([itemId, v]) => ({
      itemId,
      itemName: v.itemName,
      baseUnit: v.baseUnit,
      missing: v.used - Math.max(0, v.onHand),
    }))
  const isShort = (id: string) => shortages.some((s) => s.itemId === id)

  const costOf = (row: Row, preview: ProductionPreviewDto | undefined) =>
    (preview?.ingredients ?? []).reduce((sum, i) => sum + actualFor(row, i.itemId, i.required) * i.unitCost, 0)
  const totalCost = rows.reduce((sum, row, index) => sum + costOf(row, previews[index]?.data), 0)

  const rowsValid = rows.length > 0 && rows.every((r) => Boolean(r.itemId) && Number(r.planned) > 0)
  // Lo gastado no puede ser negativo: restaría del total y escondería un faltante.
  const actualsValid = !adjust || rows.every((r) => Object.values(r.actuals).every(isNonNegative))
  const canSubmit =
    rowsValid &&
    actualsValid &&
    !pending &&
    (isPlan ||
      (rows.every((r) => Number(r.produced) > 0) && previews.every((p) => Boolean(p.data)) && shortages.length === 0))

  const updateRow = (key: number, change: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...change } : r)))

  const chooseProduct = (key: number, id: string, list: ProducibleItemDto[] = products) => {
    const p = list.find((x) => x.itemId === id)
    const row = rows.find((r) => r.key === key)
    // Si ya había cantidad (p. ej. al cambiar la receta) se conserva; si no, una tanda.
    const quantity = row?.planned && Number(row.planned) > 0 ? row.planned : p ? String(p.yieldQuantity) : ""
    updateRow(key, { itemId: id, planned: quantity, produced: quantity, actuals: {} })
  }

  const ingredientsFor = (row: Row, index: number) =>
    adjust
      ? (previews[index]?.data?.ingredients ?? []).map((i) => ({
          itemId: i.itemId,
          quantity: actualFor(row, i.itemId, i.required),
        }))
      : null

  const fail = (error: unknown) => notify.error(getApiErrorMessage(error, t("save_error")))

  const submit = () => {
    if (!canSubmit) return
    if (fromPlan) {
      complete.mutate(
        {
          id: fromPlan.id,
          products: rows.map((r, index) => ({
            itemId: r.itemId!,
            producedQuantity: Number(r.produced),
            ingredients: ingredientsFor(r, index),
          })),
          notes: notes.trim() || null,
        },
        {
          onSuccess: (order) => {
            notify.success(t("production_done", { number: order.number }))
            onDone(order)
          },
          onError: fail,
        }
      )
      return
    }
    create.mutate(
      {
        branchId: branch.id,
        products: rows.map((r, index) => ({
          itemId: r.itemId!,
          plannedQuantity: Number(r.planned),
          producedQuantity: isPlan ? null : Number(r.produced),
          ingredients: isPlan ? null : ingredientsFor(r, index),
        })),
        notes: notes.trim() || null,
        complete: !isPlan,
      },
      {
        onSuccess: (order) => {
          notify.success(
            isPlan ? t("production_planned", { number: order.number }) : t("production_done", { number: order.number })
          )
          onDone(order)
        },
        onError: fail,
      }
    )
  }

  const Icon = isPlan ? CalendarClock : ChefHat
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <DialogTitle>
                {fromPlan
                  ? t("production_complete_title", { number: fromPlan.number })
                  : isPlan
                    ? t("production_plan_title")
                    : t("production_new_title")}
              </DialogTitle>
              <DialogDescription>
                {isPlan ? t("production_plan_desc") : t("production_new_desc", { branch: branch.name })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{t("production_products")}</p>
            {!isPlan ? (
              <div className="flex items-center gap-2">
                <Switch id="produccion-ajustar" checked={adjust} onCheckedChange={setAdjust} />
                <Label htmlFor="produccion-ajustar">{t("production_adjust")}</Label>
              </div>
            ) : null}
          </div>
          {!fromPlan && !productsLoading && products.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("production_no_products")}</p>
          ) : null}

          {rows.map((row, index) => {
            const { product, itemName, baseUnit } = infoFor(row)
            const preview = previews[index]?.data
            const plannedQty = Number(row.planned) || 0
            const producedQty = Number(row.produced) || 0
            const cost = costOf(row, preview)
            const taken = new Set(rows.filter((r) => r.key !== row.key).map((r) => r.itemId))
            return (
              <div key={row.key} className="space-y-3 rounded-xl border border-border/70 p-3">
                <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
                  <div className="space-y-2">
                    <Label htmlFor={`produccion-producto-${row.key}`}>{t("production_product")}</Label>
                    {fromPlan ? (
                      <Input id={`produccion-producto-${row.key}`} value={itemName} disabled />
                    ) : productsLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select value={row.itemId ?? ""} onValueChange={(id) => chooseProduct(row.key, id)}>
                        <SelectTrigger id={`produccion-producto-${row.key}`}>
                          <SelectValue placeholder={t("production_product_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter((p) => !taken.has(p.itemId))
                            .map((p) => (
                              <SelectItem key={p.itemId} value={p.itemId}>
                                {p.itemName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    {product ? (
                      <p className="text-xs text-muted-foreground">
                        {t("production_batch_hint", {
                          quantity: formatQuantity(product.yieldQuantity, product.baseUnit),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`produccion-planeado-${row.key}`}>{t("production_planned_qty")}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`produccion-planeado-${row.key}`}
                        type="number"
                        min={0}
                        step="any"
                        value={row.planned}
                        disabled={Boolean(fromPlan)}
                        onChange={(e) => updateRow(row.key, { planned: e.target.value, produced: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">{unitSymbol(baseUnit)}</span>
                    </div>
                  </div>
                  {!isPlan ? (
                    <div className="space-y-2">
                      <Label htmlFor={`produccion-salio-${row.key}`}>{t("production_produced_qty")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`produccion-salio-${row.key}`}
                          type="number"
                          min={0}
                          step="any"
                          value={row.produced}
                          onChange={(e) => updateRow(row.key, { produced: e.target.value })}
                        />
                        <span className="text-xs text-muted-foreground">{unitSymbol(baseUnit)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                  {!fromPlan && rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:mt-7"
                      aria-label={t("production_remove_product")}
                      onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>

                {row.itemId && plannedQty > 0 ? (
                  !preview ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className={previews[index]?.isFetching ? "opacity-70" : undefined}>
                      <div className="w-full overflow-x-auto">
                        <Table className="min-w-[560px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("production_ingredient")}</TableHead>
                              <TableHead className="text-right">{t("production_recipe_says")}</TableHead>
                              {adjust && !isPlan ? (
                                <TableHead className="w-36">{t("production_used")}</TableHead>
                              ) : null}
                              <TableHead className="text-right">{t("on_hand")}</TableHead>
                              <TableHead className="text-right">{t("cost")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.ingredients.map((i) => (
                              <TableRow key={i.itemId}>
                                <TableCell>
                                  <p className="font-medium text-foreground">{i.itemName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatUnitCost(i.unitCost)} / {unitSymbol(i.baseUnit)}
                                  </p>
                                </TableCell>
                                <TableCell className="text-right">{formatQuantity(i.required, i.baseUnit)}</TableCell>
                                {adjust && !isPlan ? (
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        aria-label={t("production_used")}
                                        value={row.actuals[i.itemId] ?? String(i.required)}
                                        onChange={(e) =>
                                          updateRow(row.key, {
                                            actuals: { ...row.actuals, [i.itemId]: e.target.value },
                                          })
                                        }
                                      />
                                      <span className="text-xs text-muted-foreground">{unitSymbol(i.baseUnit)}</span>
                                    </div>
                                  </TableCell>
                                ) : null}
                                <TableCell
                                  className={
                                    !isPlan && isShort(i.itemId)
                                      ? "text-right font-medium text-destructive"
                                      : "text-right"
                                  }
                                >
                                  {formatQuantity(i.onHand, i.baseUnit)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatMoney(actualFor(row, i.itemId, i.required) * i.unitCost)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                ) : null}

                {row.itemId ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {!fromPlan && product ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setChanging({ rowKey: row.key, product })}
                      >
                        <Pencil className="mr-2 size-4" />
                        {t("production_change_recipe")}
                      </Button>
                    ) : (
                      <span />
                    )}
                    {!isPlan && preview ? (
                      <p className="text-sm text-muted-foreground">
                        {t("production_total_cost")}:{" "}
                        <span className="font-medium text-foreground">{formatMoney(cost)}</span>
                        {" · "}
                        {t("production_unit_cost", { name: itemName })}:{" "}
                        <span className="font-medium text-foreground">
                          {producedQty > 0 ? `${formatUnitCost(cost / producedQty)} / ${unitSymbol(baseUnit)}` : "—"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}

          {!fromPlan ? (
            <Button
              id="btn-agregar-producto-produccion"
              type="button"
              variant="outline"
              disabled={products.length <= rows.length}
              onClick={() => setRows((current) => [...current, emptyRow()])}
            >
              <Plus className="mr-2 size-4" />
              {t("production_add_product")}
            </Button>
          ) : null}

          {!isPlan && shortages.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-destructive/30 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="size-4" />
                {t("production_blocked")}
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {shortages.map((s) => (
                  <li key={s.itemId}>
                    {t("production_missing", { name: s.itemName, quantity: formatQuantity(s.missing, s.baseUnit) })}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {rows.length > 1 ? t("production_fix_hint_many") : t("production_fix_hint")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/business/inventory/purchase-orders?tab=receipts")}
                >
                  {t("production_fix_receipt")}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => navigate("/business/inventory/stock")}>
                  {t("production_fix_count")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="produccion-nota">{t("notes")}</Label>
            <Textarea
              id="produccion-nota"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap items-center gap-2">
          {rows.length > 1 && previews.some((p) => p.data) ? (
            <p className="mr-auto text-sm text-muted-foreground">
              {t("production_order_cost")}:{" "}
              <span className="font-medium text-foreground">{formatMoney(totalCost)}</span>
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button id="btn-registrar-produccion" type="button" onClick={submit} disabled={!canSubmit}>
            {pending ? t("saving") : isPlan ? t("production_save_plan") : t("production_register")}
          </Button>
        </DialogFooter>

        {changing ? (
          <RecipeChangeDialog
            branchId={branch.id}
            product={changing.product}
            onOpenChange={(open) => !open && setChanging(null)}
            onCreated={(product) => {
              setCreated((current) => [...current, product])
              chooseProduct(changing.rowKey, product.itemId, [...products, product])
              setChanging(null)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
