import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  const [selectedItem, setSelectedItem] = useState("")
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
      setSelectedItem("")
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
    // Reiniciar para poder volver a elegir el mismo producto (Radix Select
    // no dispara onValueChange si el valor no cambia).
    setSelectedItem("")
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
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create_order")}</DialogTitle>
          <DialogDescription>{t("manual_order_desc")}</DialogDescription>
        </DialogHeader>

        {/* Selector de producto de la sucursal */}
        <div className="space-y-1.5">
          <Label htmlFor="manual-order-item">{t("items")}</Label>
          <Select value={selectedItem} onValueChange={addLine}>
            <SelectTrigger id="manual-order-item" className="w-full">
              <SelectValue placeholder={t("select_item_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {selectableItems.map((item) => (
                <SelectItem key={item.itemPublicId} value={item.itemPublicId}>
                  {item.itemName ?? item.itemPublicId}
                  {item.itemSku ? ` (${item.itemSku})` : ""} — {formatCurrency(item.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!itemsLoading && selectableItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("no_branch_items")}</p>
          ) : null}
        </div>

        {/* Líneas de la orden */}
        {lines.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("items")}</TableHead>
                  <TableHead className="w-28">{t("unit_price")}</TableHead>
                  <TableHead className="w-24">{t("quantity")}</TableHead>
                  <TableHead className="w-32 text-right">{t("line_amount")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.key}>
                    <TableCell className="font-medium">
                      {line.name}
                      {line.sku ? <span className="ml-1 text-xs text-muted-foreground">({line.sku})</span> : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        className="h-8"
                        value={line.price}
                        onChange={(e) =>
                          updateLine(line.key, {
                            price: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        inputMode="numeric"
                        className="h-8"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, {
                            quantity: e.target.value === "" ? 1 : Math.max(1, Math.floor(Number(e.target.value))),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(line.price * line.quantity)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={t("remove_line")}
                        onClick={() => removeLine(line.key)}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {/* Datos de la venta */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("payment_method")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
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

        {/* Envío / domicilio (opcional) — alimenta el stat "Domicilios cobrados" */}
        <div className="space-y-3 rounded-xl border border-border/70 p-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("shipping_section")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("address")}</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} maxLength={300} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("shipping_city")}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={150} />
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
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label>{t("notes")}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
        </div>

        {/* Totales */}
        <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("shipping_cost")}</span>
            <span className="tabular-nums">{formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-border/70 pt-1.5 text-base font-semibold text-foreground">
            <span>{t("total")}</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            <Plus className="mr-2 size-4" />
            {createOrder.isPending ? t("saving") : t("create_order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
