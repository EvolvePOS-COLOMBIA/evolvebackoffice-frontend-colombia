import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import { useNotify } from "@/hooks/use-notify"
import { ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderDetail, CancellationType, OrderItemDto } from "../types"
import { useCancelOrder, useOrderDetail } from "../hooks/use-orders"
import { getApiErrorMessage, isBeverage, buildCancellationInitialState } from "../utils/order-helpers"
import { RotateCcw, Trash2, AlertTriangle, Loader2, Coffee, Utensils, Sparkles } from "lucide-react"

/** Propiedades del componente CancelOrderDialog. */
interface CancelOrderDialogProps {
  /** Indica si el diálogo está abierto. */
  open: boolean
  /** Callback para cambiar el estado de apertura. */
  onOpenChange: (open: boolean) => void
  /** Orden que se desea cancelar. */
  order: OrderListItem | OrderDetail | null
  /** Callback opcional invocado tras una cancelación exitosa. */
  onSuccess?: () => void
}

/** Propiedades del formulario interno CancelOrderForm. */
interface CancelOrderFormProps {
  /** Orden que se desea cancelar. */
  order: OrderListItem | OrderDetail
  /** Lista de ítems pertenecientes a la orden. */
  items: OrderItemDto[]
  /** Callback para cerrar o cambiar estado del diálogo. */
  onOpenChange: (open: boolean) => void
  /** Callback opcional invocado al completar la cancelación. */
  onSuccess?: () => void
}

/**
 * Formulario interno de cancelación de orden.
 * Aísla el estado local y evita reinicios involuntarios provocados por refetches de la orden.
 */
function CancelOrderForm({ order, items, onOpenChange, onSuccess }: CancelOrderFormProps) {
  const { t } = useTranslation("business-orders")
  const notify = useNotify()
  const cancelMutation = useCancelOrder()

  const [initial] = useState(() => buildCancellationInitialState(order, items))
  const [cancellationType, setCancellationType] = useState<CancellationType>(initial.cancellationType)
  const [customPerItem, setCustomPerItem] = useState(initial.customPerItem)
  const [itemDispositions, setItemDispositions] = useState<Record<string, CancellationType>>(initial.itemDispositions)
  const [reason, setReason] = useState(initial.reason)

  const isWasteDefault =
    order.statusCode === "Preparing" || order.statusCode === "Ready" || order.statusCode === "Shipped"
  const orderRef = order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)
  const statusConfig = ORDER_STATUS_CONFIG[order.statusCode]

  // Conteo de ítems según disposición
  const wasteCount = items.filter((item) => (itemDispositions[item.id] ?? cancellationType) === "Waste").length
  const restockedCount = items.filter((item) => (itemDispositions[item.id] ?? cancellationType) === "Restocked").length

  /** Aplica la misma disposición a todos los productos de la orden. */
  const handleSetAllItems = (type: CancellationType) => {
    const updated: Record<string, CancellationType> = {}
    items.forEach((item) => {
      updated[item.id] = type
    })
    setItemDispositions(updated)
    setCancellationType(type)
  }

  /** Aplica la regla rápida: bebidas selladas a inventario y comida preparada a merma. */
  const handlePresetBeveragesStock = () => {
    const updated: Record<string, CancellationType> = {}
    items.forEach((item) => {
      updated[item.id] = isBeverage(item.name) ? "Restocked" : "Waste"
    })
    setItemDispositions(updated)
    setCustomPerItem(true)
  }

  /** Envía la solicitud de cancelación al backend con los ítems y motivos seleccionados. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cancelMutation.isPending) return

    const payloadItems =
      customPerItem && items.length > 0
        ? items.map((item) => ({
            orderItemId: item.id,
            disposition: itemDispositions[item.id] ?? cancellationType,
          }))
        : undefined

    const effectiveGlobalType = payloadItems
      ? payloadItems.some((i) => i.disposition === "Waste")
        ? "Waste"
        : "Restocked"
      : cancellationType

    cancelMutation.mutate(
      {
        id: order.id,
        payload: {
          cancellationType: effectiveGlobalType,
          reason: reason.trim() || undefined,
          items: payloadItems,
        },
      },
      {
        onSuccess: () => {
          notify.success(t("cancel_order_success"))
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (err) => {
          notify.error(getApiErrorMessage(err, t("cancel_order_failed")))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader>
        <div className="flex items-center justify-between pr-6">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {t("cancel_order_title", { reference: orderRef })}
          </DialogTitle>
          {statusConfig && <Badge tone={statusConfig.color}>{statusConfig.label}</Badge>}
        </div>
        <DialogDescription>{t("cancel_order_desc")}</DialogDescription>
      </DialogHeader>

      {/* Selector de modo: Toda la orden vs Por producto */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setCustomPerItem(false)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              !customPerItem ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("cancellation_mode_all")}
          </button>
          <button
            type="button"
            onClick={() => setCustomPerItem(true)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              customPerItem ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("cancellation_mode_custom")}</span>
            <Badge tone="info" className="px-1.5 py-0 text-[10px]">
              {items.length}
            </Badge>
          </button>
        </div>
      )}

      {/* MODO 1: Toda la orden */}
      {!customPerItem && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">{t("cancellation_disposition")}</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Opción 1: Devolver al inventario (Restocked) */}
            <button
              type="button"
              onClick={() => {
                setCancellationType("Restocked")
                handleSetAllItems("Restocked")
              }}
              className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                cancellationType === "Restocked"
                  ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                  : "border-border/70 hover:border-border hover:bg-muted/40"
              }`}
            >
              <div className="mb-1.5 flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RotateCcw className="size-4 text-primary" />
                  <span>{t("cancellation_type_restocked")}</span>
                </div>
                {!isWasteDefault && (
                  <Badge tone="info" className="px-1.5 py-0 text-[10px]">
                    {t("cancellation_suggested_badge")}
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{t("cancellation_type_restocked_desc")}</p>
            </button>

            {/* Opción 2: Registrar como merma (Waste) */}
            <button
              type="button"
              onClick={() => {
                setCancellationType("Waste")
                handleSetAllItems("Waste")
              }}
              className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                cancellationType === "Waste"
                  ? "border-destructive bg-destructive/5 shadow-sm ring-2 ring-destructive/20"
                  : "border-border/70 hover:border-border hover:bg-muted/40"
              }`}
            >
              <div className="mb-1.5 flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <Trash2 className="size-4 text-destructive" />
                  <span>{t("cancellation_type_waste")}</span>
                </div>
                {isWasteDefault && (
                  <Badge tone="warning" className="px-1.5 py-0 text-[10px]">
                    {t("cancellation_suggested_badge")}
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{t("cancellation_type_waste_desc")}</p>
            </button>
          </div>
        </div>
      )}

      {/* MODO 2: Personalizar por producto */}
      {customPerItem && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-sm font-semibold">{t("cancellation_items_title")}</Label>
            {/* Botón de acceso rápido para bebidas vs comida */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePresetBeveragesStock}
              className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
            >
              <Sparkles className="size-3.5" />
              {t("cancellation_quick_beverages_restocked")}
            </Button>
          </div>

          {/* Lista interactiva de productos */}
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-card/60 p-3">
            {items.map((item) => {
              const beverage = isBeverage(item.name)
              const itemDisp = itemDispositions[item.id] ?? cancellationType

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/80 p-2.5 transition-colors hover:bg-muted/20"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                        beverage
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-600"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {beverage ? <Coffee className="size-4" /> : <Utensils className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {item.quantity}× {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {beverage ? t("cancellation_item_beverage") : t("cancellation_item_food")}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción por producto */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Botón Devolver a Stock */}
                    <button
                      type="button"
                      onClick={() =>
                        setItemDispositions((prev) => ({
                          ...prev,
                          [item.id]: "Restocked",
                        }))
                      }
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        itemDisp === "Restocked"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <RotateCcw className="size-3" />
                      <span>{t("cancellation_item_restocked_short")}</span>
                    </button>

                    {/* Botón Merma */}
                    <button
                      type="button"
                      onClick={() =>
                        setItemDispositions((prev) => ({
                          ...prev,
                          [item.id]: "Waste",
                        }))
                      }
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        itemDisp === "Waste"
                          ? "text-destructive-foreground bg-destructive shadow-sm"
                          : "border border-border/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Trash2 className="size-3" />
                      <span>{t("cancellation_item_waste_short")}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen de cantidades */}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-primary">
              <RotateCcw className="size-3" />
              {t("cancellation_summary_restocked_count", {
                count: restockedCount,
              })}
            </span>
            <span className="flex items-center gap-1 font-medium text-destructive">
              <Trash2 className="size-3" />
              {t("cancellation_summary_waste_count", { count: wasteCount })}
            </span>
          </div>
        </div>
      )}

      {/* Motivo de cancelación */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cancel-reason" className="text-sm font-semibold">
            {t("cancellation_reason_label")}
          </Label>
          <span className="text-xs text-muted-foreground">
            {t("cancellation_reason_chars", { count: reason.length })}
          </span>
        </div>
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          placeholder={t("cancellation_reason_placeholder")}
          className="resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={cancelMutation.isPending} onClick={() => onOpenChange(false)}>
          {t("cancel_order_back")}
        </Button>
        <Button type="submit" variant="destructive" disabled={cancelMutation.isPending}>
          {cancelMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("cancel_order_confirm")}…
            </>
          ) : (
            t("cancel_order_confirm")
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Diálogo modal para cancelar una orden.
 * Monta el formulario interno CancelOrderForm con una clave única por orden y cantidad de ítems,
 * aislando la edición local y eliminando errores de sincronización o reinicios por refetch.
 */
export function CancelOrderDialog({ open, onOpenChange, order, onSuccess }: CancelOrderDialogProps) {
  // Cargar detalles para tener la lista de ítems completa si es un OrderListItem
  const { data: detail } = useOrderDetail(open && order ? order.id : "")

  const items = useMemo(() => {
    if (detail?.items && detail.items.length > 0) return detail.items
    if (order && "items" in order && Array.isArray((order as OrderDetail).items)) {
      return (order as OrderDetail).items
    }
    return []
  }, [detail, order])

  if (!order) return null

  // Clave que se actualiza si cambia la orden o cuando los ítems de detail terminan de cargar
  const formKey = `${order.id}-${items.length}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <CancelOrderForm key={formKey} order={order} items={items} onOpenChange={onOpenChange} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
