import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Minus, Plus, Search, ShoppingBasket, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { FIELD_SURFACE_CLASS } from "@/components/ui/field-surface"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInputBare } from "@/components/ui/money-input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useBranchItems } from "@/features/business/items/catalog/hooks/use-branch-items"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useCreateManualOrder } from "../hooks/use-orders"
import { usePrintComanda } from "../hooks/use-print-comanda"
import { ORDER_ORIGIN_LABEL_KEY } from "../types"
import type { CreateManualOrderDto } from "../types/api"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"

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

/** Columnas de la tabla de líneas en escritorio: producto | cantidad | precio | importe | quitar. */
const LINE_COLUMNS = "md:grid-cols-[minmax(0,1fr)_7rem_8rem_6.5rem_2.25rem]"

const SECTION_TITLE = "text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase"

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
 * Layout (escritorio): a la izquierda el buscador, la tabla de líneas y el
 * resumen de la compra fijo al fondo de la columna; a la derecha el
 * formulario (venta, entrega y notas). El pie solo lleva el contador de
 * productos/unidades y las acciones. En móvil es una hoja a pantalla completa.
 *
 * No envía `tax`: en Colombia el backend cobra el precio rotulado (IVA
 * incluido) y declara el IVA extraído; en otros países agrega la tasa
 * configurada del tenant.
 */
export function ManualOrderDialog({ open, onOpenChange, branchId }: ManualOrderDialogProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency, locale, currency } = useLocaleFormat()
  const createOrder = useCreateManualOrder()
  const { printComanda } = usePrintComanda()
  const { data: branchItems, isLoading: itemsLoading } = useBranchItems(open ? branchId : null, {
    pageNumber: 1,
    pageSize: 100,
  })

  const [lines, setLines] = useState<OrderLine[]>([])
  const [productQuery, setProductQuery] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  // Medios del catálogo del tenant: el código viaja tal cual al pedido, así el
  // backend sabe si es efectivo (anticipo y cobro del domiciliario).
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods", "active"],
    queryFn: getActivePaymentMethods,
    enabled: open,
    staleTime: 60_000,
  })
  const [chosenPaymentMethod, setPaymentMethod] = useState<string | null>(null)
  // Sin elección: el primer medio en efectivo (o el primero del catálogo).
  const paymentMethod = chosenPaymentMethod ?? (paymentMethods.find((m) => m.isCash) ?? paymentMethods[0])?.code ?? ""
  const [status, setStatus] = useState("Confirmed")
  const [origin, setOrigin] = useState("")
  const [notes, setNotes] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [shippingCost, setShippingCost] = useState<number | null>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setLines([])
      setProductQuery("")
      setPickerOpen(false)
      setPaymentMethod(null)
      setStatus("Confirmed")
      setOrigin("")
      setNotes("")
      setStreet("")
      setCity("")
      setShippingCost(null)
    }
  }

  const currencySymbol = useMemo(
    () =>
      new Intl.NumberFormat(locale, { style: "currency", currency })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? "$",
    [locale, currency]
  )

  const selectableItems = useMemo(() => (branchItems?.data ?? []).filter((i) => !i.inactive), [branchItems])

  /** Productos filtrados por nombre o SKU según lo escrito en el buscador. */
  const filteredItems = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    if (!query) return selectableItems
    return selectableItems.filter(
      (i) => i.itemName?.toLowerCase().includes(query) || i.itemSku?.toLowerCase().includes(query)
    )
  }, [selectableItems, productQuery])

  /** Cantidad ya agregada a la orden por producto (para marcarlo en el selector). */
  const quantityInOrder = useMemo(() => new Map(lines.map((l) => [l.itemPublicId, l.quantity])), [lines])

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
    // El selector queda abierto (y con su búsqueda) para sumar varios productos seguidos.
  }

  const updateLine = (key: string, patch: Partial<OrderLine>) => {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const removeLine = (key: string) => {
    setLines((current) => current.filter((l) => l.key !== key))
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const units = lines.reduce((sum, l) => sum + l.quantity, 0)
  const shipping = shippingCost !== null && shippingCost > 0 ? shippingCost : 0
  const total = subtotal + shipping

  const canSubmit =
    lines.length > 0 &&
    lines.every((l) => l.quantity >= 1 && l.price >= 0) &&
    Boolean(paymentMethod) &&
    !createOrder.isPending

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
      onSuccess: (createdOrder) => {
        notify.success(t("order_created"))
        if (createdOrder) {
          void printComanda(createdOrder, { autoOnly: true })
        }
        onOpenChange(false)
      },
      onError: (error) => {
        notify.error(apiErrorMessage(error) ?? t("order_create_error"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90dvh,48.75rem)] w-[min(94vw,70rem)] flex-col gap-0 overflow-hidden p-0 max-md:h-dvh max-md:max-h-none max-md:w-screen max-md:rounded-none">
        {/* Cabecera */}
        <header className="flex items-center gap-3.5 border-b border-border/70 py-4 pr-16 pl-5 md:py-[1.125rem] md:pl-7">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBasket className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-lg">{t("create_order")}</DialogTitle>
            <DialogDescription className="text-[13px] leading-[18px]">{t("manual_order_desc")}</DialogDescription>
          </div>
        </header>

        {/* Dos columnas en escritorio (productos | formulario); en móvil una sola columna con scroll */}
        <div className="grid min-h-0 flex-1 grid-cols-1 max-md:overflow-y-auto md:grid-cols-[minmax(0,1fr)_27.5rem]">
          {/* Izquierda: buscador, líneas y resumen fijo */}
          <section className="flex min-w-0 flex-col gap-4 px-4 pt-4 md:min-h-0 md:px-7 md:pt-[1.375rem]">
            {/* Buscador de productos (combobox). `modal`: el popover se renderiza por portal fuera del
                diálogo y el bloqueo de scroll de este lo dejaba sin rueda del ratón (EC-2). */}
            <Popover modal open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-between gap-2 rounded-xl px-3.5 font-normal text-muted-foreground max-md:h-12",
                    FIELD_SURFACE_CLASS
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Search className="size-4 shrink-0" />
                    <span className="truncate">{t("select_item_placeholder")}</span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", pickerOpen && "rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl p-0"
                align="start"
              >
                <div className="border-b border-border/70 p-2.5">
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder={t("search_products")}
                    aria-label={t("search_products")}
                    className="h-10"
                    autoFocus
                  />
                </div>
                <div className="max-h-[min(20.5rem,50dvh)] overflow-y-auto p-1.5">
                  {itemsLoading ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">{t("loading_products")}</p>
                  ) : filteredItems.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      {productQuery ? t("no_product_results") : t("no_branch_items")}
                    </p>
                  ) : (
                    filteredItems.map((item) => {
                      const inOrder = quantityInOrder.get(item.itemPublicId) ?? 0
                      return (
                        <button
                          key={item.itemPublicId}
                          type="button"
                          onClick={() => addLine(item.itemPublicId)}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                            inOrder > 0 && "bg-primary/10"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{item.itemName ?? item.itemPublicId}</span>
                            {item.itemSku ? (
                              <span className="block text-xs text-muted-foreground">{item.itemSku}</span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2.5">
                            {inOrder > 0 ? (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {t("in_order", { count: inOrder })}
                              </span>
                            ) : null}
                            <span className="font-semibold tabular-nums">{formatCurrency(item.price)}</span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
                <p className="border-t border-border/70 px-3.5 py-2 text-[11px] text-muted-foreground">
                  {t("picker_keep_open_hint")}
                </p>
              </PopoverContent>
            </Popover>

            {/* Tabla de líneas (tarjetas en móvil) */}
            {lines.length > 0 ? (
              <div className="flex flex-col gap-2.5 md:min-h-0 md:flex-1 md:gap-0">
                <h3 className={SECTION_TITLE}>{t("items")}</h3>

                <div
                  className={cn(
                    "hidden gap-x-3 pt-3 pb-2 text-[11px] font-semibold text-muted-foreground md:grid",
                    LINE_COLUMNS
                  )}
                >
                  <span>{t("col_product")}</span>
                  <span>{t("quantity")}</span>
                  <span>{t("col_unit_price")}</span>
                  <span className="text-right">{t("col_amount")}</span>
                  <span />
                </div>

                <ul className="flex flex-col gap-2.5 md:min-h-0 md:flex-1 md:gap-0 md:overflow-y-auto">
                  {lines.map((line) => {
                    const priceChanged = line.price !== line.basePrice
                    return (
                      <li
                        key={line.key}
                        className={cn(
                          "grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-[14px] border border-border/70 bg-card p-3",
                          "md:rounded-none md:border-0 md:border-t md:bg-transparent md:px-0 md:py-3 last:md:border-b",
                          LINE_COLUMNS
                        )}
                      >
                        <div className="min-w-0 max-md:col-span-2">
                          <p className="truncate text-sm font-semibold">{line.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {line.sku}
                            {priceChanged ? (
                              <>
                                {line.sku ? " · " : ""}
                                <span className="text-amber-500">
                                  {t("price_modified", { price: formatCurrency(line.basePrice) })}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>

                        {/* Stepper de cantidad */}
                        <div
                          className={cn(
                            "flex h-9 items-center justify-between rounded-[10px] border border-border/70 px-[3px] max-md:h-10",
                            FIELD_SURFACE_CLASS
                          )}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="size-7 max-md:size-8"
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
                            className="h-7 w-9 border-0 bg-transparent px-0 text-center text-sm font-semibold tabular-nums shadow-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            size="icon-xs"
                            className="size-7 max-md:size-8"
                            aria-label={`${t("quantity")} +`}
                            onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>

                        {/* Precio unitario editable (compacto, con símbolo de moneda dentro del campo) */}
                        <label
                          className={cn(
                            "flex h-9 items-center gap-1.5 rounded-[10px] border px-2.5 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 max-md:h-10",
                            FIELD_SURFACE_CLASS,
                            priceChanged ? "border-amber-400/60" : "border-border/70"
                          )}
                        >
                          <span aria-hidden className="text-[13px] text-muted-foreground">
                            {currencySymbol}
                          </span>
                          <MoneyInputBare
                            aria-label={t("unit_price_of", { name: line.name })}
                            className="w-full min-w-0 bg-transparent p-0 text-right tabular-nums outline-none"
                            value={line.price}
                            onChange={(price) => updateLine(line.key, { price: price ?? 0 })}
                          />
                        </label>

                        {/* Importe de la línea */}
                        <span className="text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(line.price * line.quantity)}
                        </span>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          className="max-md:col-start-3 max-md:row-start-1 max-md:size-11"
                          aria-label={t("remove_line")}
                          onClick={() => removeLine(line.key)}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
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
              <p className="text-xs text-muted-foreground">{t("no_branch_items")}</p>
            ) : null}

            {/* Resumen de la compra: fijo al fondo de la columna de productos */}
            <div
              data-slot="order-summary"
              className="mt-auto shrink-0 pb-5 max-md:sticky max-md:bottom-0 max-md:bg-card max-md:pt-2 max-md:pb-3"
            >
              <div className="flex items-center justify-between gap-6 rounded-[14px] border border-border/70 bg-background/60 px-4 py-3.5">
                <dl className="flex min-w-0 flex-col gap-1 text-[13px] md:min-w-48">
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">{t("subtotal")}</dt>
                    <dd className="font-semibold tabular-nums">{formatCurrency(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">{t("shipping_cost")}</dt>
                    <dd className="font-semibold tabular-nums">{formatCurrency(shipping)}</dd>
                  </div>
                </dl>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">{t("total")}</p>
                  <p className="text-2xl leading-9 font-bold tabular-nums md:text-3xl">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Derecha: formulario (datos de la venta, entrega y notas) */}
          <aside className="flex flex-col gap-5 border-t border-border/70 bg-muted/30 px-4 py-5 md:min-h-0 md:overflow-y-auto md:border-t-0 md:border-l md:px-7">
            <section className="space-y-3">
              <h3 className={SECTION_TITLE}>{t("sale_details")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("payment_method")}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.code} value={m.code}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("initial_status")}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 w-full">
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
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">{t("origin")}</Label>
                  <Select value={origin || "none"} onValueChange={(v) => setOrigin(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-10 w-full">
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
              </div>
            </section>

            {/* Envío / domicilio (opcional) — alimenta el stat "Domicilios cobrados" */}
            <section className="space-y-3">
              <h3 className={SECTION_TITLE}>{t("shipping_section")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="manual-order-street" className="text-xs font-semibold">
                    {t("address")}
                  </Label>
                  <Input
                    id="manual-order-street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    maxLength={300}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-order-city" className="text-xs font-semibold">
                    {t("shipping_city")}
                  </Label>
                  <Input
                    id="manual-order-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={150}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-order-shipping" className="text-xs font-semibold">
                    {t("shipping_cost")}
                  </Label>
                  <div
                    className={cn(
                      "flex h-10 items-center gap-1.5 rounded-xl border border-border/70 px-3 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
                      FIELD_SURFACE_CLASS
                    )}
                  >
                    <span aria-hidden className="text-[13px] text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <MoneyInputBare
                      id="manual-order-shipping"
                      placeholder="0"
                      className="w-full min-w-0 bg-transparent p-0 text-right tabular-nums outline-none"
                      value={shippingCost}
                      onChange={setShippingCost}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Notas */}
            <section className="space-y-1.5">
              <Label htmlFor="manual-order-notes" className={SECTION_TITLE}>
                {t("order_notes")}
              </Label>
              <Textarea
                id="manual-order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </section>
          </aside>
        </div>

        {/* Pie fijo: contador de productos y acciones */}
        <footer
          data-slot="order-footer"
          className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-3.5 md:px-7"
        >
          <p className="flex items-center gap-2.5 text-sm font-semibold">
            <ShoppingBasket className="size-[1.125rem] text-muted-foreground" aria-hidden />
            <span>
              {t("items_count", { count: lines.length })} · {t("units_count", { count: units })}
            </span>
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-xl px-5 max-md:hidden"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-xl px-6 max-md:h-12 max-md:flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              <Plus className="mr-2 size-4" />
              {createOrder.isPending ? t("saving") : t("create_order")}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
