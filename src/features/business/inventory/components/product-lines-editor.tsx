import { useState, type Dispatch, type SetStateAction } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useItems } from "@/features/business/items/catalog/hooks/use-items"
import { useTranslation } from "@/i18n/use-i18n"
import { useItemPackagings, useStock } from "../hooks/use-inventory"
import { getItemPackagings } from "../services/inventory.service"
import type { ItemPackagingDto } from "../types"
import {
  DEFAULT_LINE_PRICE,
  defaultLinePrice,
  type LinePrice,
  type PriceBase,
  percentBase,
  priceBase,
  resolvePrice,
  scaleBase,
} from "../utils/pricing"
import { BASE_UNIT_KEY, formatQuantity, unitSymbol, type QuantityUnitValue } from "../utils/units"
import { BulkPercent, LinePriceInput } from "./line-price-input"
import { QuantityUnitInput } from "./quantity-unit-input"

export type ProductLine = {
  itemId: string
  name: string
  sku: string | null
  baseUnit: number
  quantity: QuantityUnitValue
  /** Precio por la unidad elegida (presentación o unidad base). Entradas: costo; ventas/envíos: precio resultante. */
  unitCost?: string
  /** Modo precio: precio de venta y costo por unidad base, y cómo se fija el de esta línea. */
  priceBase?: PriceBase
  linePrice?: LinePrice
}

type ProductLinesEditorProps = {
  lines: ProductLine[]
  /** Recibe el <c>setState</c> de la lista: los cambios se aplican sobre la lista actual. */
  onChange: Dispatch<SetStateAction<ProductLine[]>>
  /** Muestra la columna de precio (entradas de proveedor, ventas). */
  withPrice?: boolean
  /** También permite platos que no se guardan pero tienen receta (ventas). */
  includeRecipeItems?: boolean
  /** Precio de venta y costo por unidad base al agregar un producto (precio propuesto). */
  priceFor?: (itemId: string) => Promise<{ price: number | null; cost: number | null }>
  /**
   * Sucursal de la que sale la mercancía (envíos): la lista muestra solo lo que tiene
   * saldo en ella y cuánto hay. Sin esto, se lista el catálogo.
   */
  stockBranchId?: string | null
  /**
   * Ventas y envíos: el precio parte del precio de venta (de <c>priceFor</c>; si no tiene, del costo) y en
   * cada línea se elige ese precio, + % o especial. <c>noBaseLabel</c> = qué pasa si no hay ninguno.
   */
  priceMode?: { noBaseLabel: string }
}

/** Producto que se puede agregar; <c>onHand</c> solo cuando se lista el saldo de una sucursal. */
type Candidate = { id: string; name: string; sku: string | null; baseUnit: number; onHand?: number }

/** Cuántos productos se cargan en la lista (con desplazamiento); el buscador filtra el resto. */
const LIST_SIZE = 50

/** Buscar productos que manejan inventario y escribir cuánto, en bultos/cajas o unidad base. */
export function ProductLinesEditor({
  lines,
  onChange,
  withPrice = false,
  includeRecipeItems = false,
  priceFor,
  stockBranchId,
  priceMode,
}: ProductLinesEditorProps) {
  const { t } = useTranslation("business-inventory")
  const [search, setSearch] = useState("")
  const term = search.trim()
  const fromStock = Boolean(stockBranchId)

  // La lista aparece sin tener que buscar; el buscador solo la acorta.
  const catalog = useItems({ pageSize: LIST_SIZE, searchField: "all", searchValue: term || undefined })
  const stock = useStock({
    branchId: stockBranchId ?? null,
    search: term,
    belowMin: false,
    negative: false,
    pageNumber: 1,
    pageSize: LIST_SIZE,
  })
  const source: Candidate[] = fromStock
    ? (stock.data?.items ?? [])
        .filter((s) => s.quantity > 0)
        .map((s) => ({ id: s.itemId, name: s.itemName, sku: s.sku, baseUnit: s.baseUnit, onHand: s.quantity }))
    : (catalog.data?.data ?? [])
        .filter((i) => i.trackInventory || (includeRecipeItems && i.hasRecipe))
        .map((i) => ({ id: i.id, name: i.name ?? "", sku: i.sku, baseUnit: i.baseUnit }))
  const candidates = source.filter((c) => !lines.some((l) => l.itemId === c.id))
  const loading = fromStock ? stock.isLoading : catalog.isLoading

  const queryClient = useQueryClient()

  // La cantidad arranca en la presentación "De compra" (ej. Bulto 50 kg); si no hay, en la unidad base.
  const packagingsOf = (itemId: string) =>
    queryClient.getQueryData<ItemPackagingDto[]>(["item-packagings", itemId]) ?? []

  // Modo precio: el precio de la línea sale del precio base, el modo/% y la unidad elegida.
  const withResolvedPrice = (line: ProductLine, packagings = packagingsOf(line.itemId)): ProductLine =>
    priceMode && line.priceBase ? { ...line, unitCost: priceModeUnitCost(line, packagings) } : line

  const add = async (item: Candidate) => {
    const packagings = await queryClient
      .fetchQuery({ queryKey: ["item-packagings", item.id], queryFn: () => getItemPackagings(item.id) })
      .catch(() => [])
    const defaultPackaging = packagings.find((p) => p.isDefaultPurchase)
    const known = priceFor ? await priceFor(item.id).catch(() => null) : null
    const base = priceBase(known?.price, priceMode ? known?.cost : null)
    const linePrice = defaultLinePrice(base)
    const suggestedPrice = base.sale ? base.sale * (defaultPackaging?.factor ?? 1) : null
    const line: ProductLine = {
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      baseUnit: item.baseUnit,
      quantity: { amount: "", unitKey: defaultPackaging?.id ?? BASE_UNIT_KEY },
      unitCost: withPrice ? (suggestedPrice ? String(Math.round(suggestedPrice * 100) / 100) : "") : undefined,
      ...(priceMode ? { priceBase: base, linePrice } : {}),
    }
    // Sobre la lista actual: mientras cargaba se pudo agregar, quitar o editar otra línea.
    onChange((current) =>
      current.some((l) => l.itemId === line.itemId) ? current : [...current, withResolvedPrice(line, packagings)]
    )
    setSearch("")
  }

  const update = (itemId: string, patch: Partial<ProductLine>) =>
    onChange((current) => current.map((l) => (l.itemId === itemId ? withResolvedPrice({ ...l, ...patch }) : l)))

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="lineas-buscar-producto"
            placeholder={t("lines_search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {candidates.length > 0 ? (
          <div className="max-h-60 divide-y overflow-y-auto rounded-lg border">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => add(c)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
              >
                <span>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.sku ?? ""}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.onHand !== undefined
                    ? t("lines_on_hand", { quantity: formatQuantity(c.onHand, c.baseUnit) })
                    : unitSymbol(c.baseUnit)}
                  <Plus className="size-4" />
                </span>
              </button>
            ))}
          </div>
        ) : loading ? null : (
          <p className="text-xs text-muted-foreground">
            {term ? t("lines_no_results") : fromStock ? t("lines_no_stock") : t("lines_all_added")}
          </p>
        )}
      </div>

      {priceMode && lines.some((l) => l.priceBase && percentBase(l.priceBase) !== null) ? (
        <BulkPercent
          onApply={(percent) =>
            onChange((current) =>
              current.map((l) =>
                l.priceBase && percentBase(l.priceBase) !== null
                  ? withResolvedPrice({
                      ...l,
                      linePrice: { ...(l.linePrice ?? DEFAULT_LINE_PRICE), mode: "percent", percent },
                    })
                  : l
              )
            )
          }
        />
      ) : null}

      {lines.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("lines_empty")}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="min-w-64">{t("quantity")}</TableHead>
                {withPrice ? <TableHead className="w-40">{t("price_per_unit_chosen")}</TableHead> : null}
                {priceMode ? <TableHead>{t("price_column")}</TableHead> : null}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.itemId}>
                  <TableCell>
                    <p className="font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.sku ?? ""}</p>
                  </TableCell>
                  <TableCell>
                    <QuantityUnitInput
                      id={`linea-cantidad-${l.itemId}`}
                      itemId={l.itemId}
                      baseUnit={l.baseUnit}
                      value={l.quantity}
                      onChange={(quantity) => update(l.itemId, { quantity })}
                    />
                  </TableCell>
                  {withPrice ? (
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        aria-label={t("price_per_unit_chosen")}
                        value={l.unitCost ?? ""}
                        onChange={(e) => update(l.itemId, { unitCost: e.target.value })}
                      />
                    </TableCell>
                  ) : null}
                  {priceMode ? (
                    <TableCell>
                      <PriceModeCell
                        line={l}
                        noBaseLabel={priceMode.noBaseLabel}
                        onChange={(patch) => update(l.itemId, patch)}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("lines_remove")}
                      onClick={() => onChange((current) => current.filter((x) => x.itemId !== l.itemId))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/** Precio resultante de una línea en ventas/envíos, por la unidad elegida ("" si no hay precio). */
function priceModeUnitCost(line: ProductLine, packagings: ItemPackagingDto[]): string {
  const factor = packagings.find((p) => p.id === line.quantity.unitKey)?.factor ?? 1
  const resolved = resolvePrice(
    scaleBase(line.priceBase ?? priceBase(null, null), factor),
    line.linePrice ?? DEFAULT_LINE_PRICE
  )
  return resolved === null ? "" : String(resolved)
}

/**
 * Precio de una línea en ventas/envíos: muestra el precio de venta convertido a la unidad elegida
 * y deja escoger el modo. El precio resultante (`unitCost`) lo calcula el editor al cambiar algo.
 */
function PriceModeCell({
  line,
  noBaseLabel,
  onChange,
}: {
  line: ProductLine
  noBaseLabel: string
  onChange: (patch: Partial<ProductLine>) => void
}) {
  const { data: packagings = [] } = useItemPackagings(line.itemId)
  const factor = packagings.find((p) => p.id === line.quantity.unitKey)?.factor ?? 1
  const unitLabel = packagings.find((p) => p.id === line.quantity.unitKey)?.name ?? unitSymbol(line.baseUnit)
  const base = scaleBase(line.priceBase ?? priceBase(null, null), factor)
  const linePrice = line.linePrice ?? DEFAULT_LINE_PRICE

  return (
    <LinePriceInput
      base={base}
      unitLabel={unitLabel}
      value={linePrice}
      noBaseLabel={noBaseLabel}
      onChange={(value) => onChange({ linePrice: value })}
    />
  )
}
