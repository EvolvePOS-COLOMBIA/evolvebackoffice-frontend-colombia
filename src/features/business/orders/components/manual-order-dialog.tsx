import { useMemo, useState } from "react"
import { ChevronDown, Minus, Plus, Search, ShoppingBasket, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useBranchItems } from "@/features/business/items/catalog/hooks/use-branch-items"
import { useCreateManualOrder } from "../hooks/use-orders"
import { ORDER_ORIGIN_LABEL_KEY } from "../types"
import type { CreateManualOrderDto } from "../types/api"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"

interface ManualOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sucursal seleccionada en la página de órdenes (obligatoria). */
  branchId: string | null
}

interface OrderLine {
  key: string
  itemPublicId: string
  name: string
  sku: string | null
  /** Precio de la sucursal al agregar la línea (para detectar override). */
  basePrice: number
  price: number
  quantity: number
}

/** Orígenes manuales ofrecidos en el formulario (miembros del enum OrderOrigin). */
const MANUAL_ORIGINS = ["WhatsApp", "Facebook", "Call", "Others"] as const

function apiErrorMessage(error: unknown): string | null {
  const e = error as {
    response?: { data?: { message?: string; title?: string } }
  }
  return e?.response?.data?.message ?? e?.response?.data?.title ?? null
}

/**
 * Formulario de creación manual de órdenes (venta de caja o domicilio),
 * enlazado desde la cabecera de Órdenes. Usa los productos activos de la
 * sucursal seleccionada con su precio de sucursal (editable por línea).
 *
 * Layout de dos columnas tipo carrito: a la izquierda el buscador de
 * productos y las líneas; a la derecha el resumen fijo con los datos de la
 * venta, el domicilio y las notas.
 *
 * No envía `tax`: en Colombia el backend cobra el precio rotulado (IVA
 * incluido) y declara el IVA extraído; en otros países agrega la tasa
 * configurada del tenant.
 */
export function ManualOrderDialog({ open, onOpenChange, branchId }: ManualOrderDialogProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const createOrder = useCreateManualOrder()
  const { data: branchItems, isLoading: itemsLoading } = useBranchItems(open ? branchId : null, {
    pageNumber: 1,
    pageSize: 100,
  })

  const [lines, setLines] = useState<OrderLine[]>([])
  const [productQuery, setProductQuery] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [status, setStatus] = useState("Confirmed")
  const [origin, setOrigin] = useState("")
  const [notes, setNotes] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [shippingCost, setShippingCost] = useState("")

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setLines([])
      setProductQuery("")
      setPickerOpen(false)
      setPaymentMethod("CASH")
      setStatus("Confirmed")
      setOrigin("")
      setNotes("")
      setStreet("")
      setCity("")
      setShippingCost("")
    }
  }

  const selectableItems = useMemo(() => (branchItems?.data ?? []).filter((i) => !i.inactive), [branchItems])

  /** Productos filtrados por nombre o SKU según lo escrito en el buscador. */
  const filteredItems = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    if (!query) return selectableItems
    return selectableItems.filter(
      (i) => i.itemName?.toLowerCase().includes(query) || i.itemSku?.toLowerCase().includes(query)
    )
  }, [selectableItems, productQuery])

  const addLine = (itemPublicId: string) => {
    const item = selectableItems.find((i) => i.itemPublicId === itemPublicId)
    if (!item) return

    setLines((current) => {
      const existing = current.find((l) => l.itemPublicId === itemPublicId)
      if (existing) {
        return current.map((l) => (l.itemPublicId === itemPublicId ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [
        ...current,
        {
          key: `${itemPublicId}-${Date.now()}`,
          itemPublicId,
          name: item.itemName ?? itemPublicId,
          sku: item.itemSku,
          basePrice: item.price,
          price: item.price,
          quantity: 1,
        },
      ]
    })
    // Cerrar el popover y limpiar la búsqueda para poder volver a elegir
    // el mismo producto sin reescribir el filtro.
    setPickerOpen(false)
    setProductQuery("")
  }

  const updateLine = (key: string, patch: Partial<OrderLine>) => {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const removeLine = (key: string) => {
    setLines((current) => current.filter((l) => l.key !== key))
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const shipping = Number(shippingCost) > 0 ? Number(shippingCost) : 0
  const total = subtotal + shipping

  const canSubmit = lines.length > 0 && lines.every((l) => l.quantity >= 1 && l.price >= 0) && !createOrder.isPending

  const handleSubmit = () => {
    if (!branchId || !canSubmit) return

    const payload: CreateManualOrderDto = {
      branchId,
      customerId: null,
      personId: null,
      paymentMethod,
      status,
      origin: origin || null,
      notes: notes.trim() ? notes.trim() : null,
      shippingStreet: street.trim() ? street.trim() : null,
      shippingCity: city.trim() ? city.trim() : null,
      shippingState: null,
      shippingZipCode: null,
      shippingLatitude: null,
      shippingLongitude: null,
      shippingNotes: null,
      tax: null,
      discount: null,
      shippingCost: shipping > 0 ? shipping : null,
      items: lines.map((l) => ({
        itemPublicId: l.itemPublicId,
        quantity: l.quantity,
        unitPriceOverride: l.price !== l.basePrice ? l.price : null,
        tax: null,
        discount: null,
        modifiersJson: null,
        notes: null,
      })),
    }

    createOrder.mutate(payload, {
      onSuccess: () => {
        notify.success(t("order_created"))
        onOpenChange(false)
      },
      onError: (error) => {
        notify.error(apiErrorMessage(error) ?? t("order_create_error"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[min(94vw,64rem)] flex-col gap-0 overflow-hidden p-0"
      >
        {/* Cabecera */}
        <header className="flex items-start gap-3 border-b border-border/70 px-6 py-4">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBasket className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle>{t("create_order")}</DialogTitle>
            <DialogDescription>{t("manual_order_desc")}</DialogDescription>
          </div>
        </header>

        {/* Dos columnas: carrito a la izquierda, resumen/datos a la derecha */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_21rem]">
          {/* Izquierda: productos + líneas */}
          <div className="flex min-h-0 flex-col overflow-y-auto px-6 py-4">
            {/* Buscador de productos (combobox) */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between gap-2 font-normal text-muted-foreground"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Search className="size-4 shrink-0" />
                    <span className="truncate">{t("select_item_placeholder")}</span>
                  </span>
                  <ChevronDown className="size-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="border-b border-border/70 p-2">
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder={t("search_products")}
                    aria-label={t("search_products")}
                    className="h-8"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {itemsLoading ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">{t("loading_products")}</p>
                  ) : filteredItems.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      {productQuery ? t("no_product_results") : t("no_branch_items")}
                    </p>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.itemPublicId}
                        type="button"
                        onClick={() => addLine(item.itemPublicId)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.itemName ?? item.itemPublicId}</span>
                          {item.itemSku ? (
                            <span className="block text-xs text-muted-foreground">{item.itemSku}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatCurrency(item.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Carrito de líneas */}
            {lines.length > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("items")}</p>
                  <Badge tone="neutral" className="text-[10px]">
                    {t("items_count", { count: lines.length })}
                  </Badge>
                </div>

                {lines.map((line) => (
                  <div
                    key={line.key}
                    className="rounded-xl border border-border/70 bg-card p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{line.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.sku ? `${line.sku} · ` : ""}
                          {t("per_unit", { price: formatCurrency(line.price) })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        aria-label={t("remove_line")}
                        onClick={() => removeLine(line.key)}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      {/* Stepper de cantidad */}
                      <div className="flex items-center gap-1 rounded-lg border border-border/70 p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          aria-label={`${t("quantity")} −`}
                          disabled={line.quantity <= 1}
                          onClick={() => updateLine(line.key, { quantity: Math.max(1, line.quantity - 1) })}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          inputMode="numeric"
                          aria-label={t("quantity")}
                          className="h-6 w-10 border-0 bg-transparent px-0 text-center text-sm tabular-nums shadow-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.key, {
                              quantity: e.target.value === "" ? 1 : Math.max(1, Math.floor(Number(e.target.value))),
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          aria-label={`${t("quantity")} +`}
                          onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>

                      {/* Precio unitario editable */}
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor={`price-${line.key}`} className="text-xs text-muted-foreground">
                          {t("unit_price")}
                        </Label>
                        <Input
                          id={`price-${line.key}`}
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          className="h-7 w-24 text-right text-sm tabular-nums"
                          value={line.price}
                          onChange={(e) =>
                            updateLine(line.key, {
                              price: e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      {/* Importe de la línea */}
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatCurrency(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <ShoppingBasket className="size-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium">{t("cart_empty_title")}</p>
                <p className="max-w-56 text-xs text-muted-foreground">{t("cart_empty_desc")}</p>
              </div>
            )}

            {!itemsLoading && selectableItems.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("no_branch_items")}</p>
            ) : null}
          </div>

          {/* Derecha: resumen + datos de la venta */}
          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-t border-border/70 bg-muted/30 px-6 py-4 md:border-t-0 md:border-l">
            {/* Resumen */}
            <section className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("order_summary")}
              </p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("shipping_cost")}</span>
                <span className="tabular-nums">{formatCurrency(shipping)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-1.5">
                <span className="text-sm font-semibold">{t("total")}</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </section>

            {/* Datos de la venta */}
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("sale_details")}</p>
              <div className="space-y-1.5">
                <Label>{t("payment_method")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t("pay_cash")}</SelectItem>
                    <SelectItem value="CARD">{t("pay_card")}</SelectItem>
                    <SelectItem value="TRANSFER">{t("pay_transfer")}</SelectItem>
                    <SelectItem value="MIXED">{t("pay_mixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("initial_status")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">{t("confirmed")}</SelectItem>
                    <SelectItem value="Pending">{t("pending")}</SelectItem>
                    <SelectItem value="NeedsReview">{t("st_review")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Origen controlado (enum OrderOrigin) — para filtrar reportes junto
                  con Cluvi/WooCommerce (que se marcan automáticamente). */}
              <div className="space-y-1.5">
                <Label>{t("origin")}</Label>
                <Select value={origin || "none"} onValueChange={(v) => setOrigin(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("origin_none")}</SelectItem>
                    {MANUAL_ORIGINS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {t(ORDER_ORIGIN_LABEL_KEY[o])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Envío / domicilio (opcional) — alimenta el stat "Domicilios cobrados" */}
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("shipping_section")}
              </p>
              <div className="space-y-1.5">
                <Label>{t("address")}</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} maxLength={300} className="bg-card" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>{t("shipping_city")}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={150} className="bg-card" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-order-shipping">{t("shipping_cost")}</Label>
                  <Input
                    id="manual-order-shipping"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </section>

            {/* Notas */}
            <section className="space-y-1.5">
              <Label>{t("notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={2}
                className="bg-card"
              />
            </section>
          </aside>
        </div>

        {/* Footer fijo */}
        <footer className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          <p className="hidden text-xs text-muted-foreground sm:block">{t("items_count", { count: lines.length })}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              <Plus className="mr-2 size-4" />
              {createOrder.isPending ? t("saving") : t("create_order")}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
