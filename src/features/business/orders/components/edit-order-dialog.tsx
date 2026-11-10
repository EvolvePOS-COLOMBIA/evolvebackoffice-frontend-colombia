import { useState } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { useOrderDetail, useUpdateOrderDetails } from "../hooks/use-orders"
import type { UpdateOrderDetailsDto } from "../types/api"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

interface EditOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
}

function apiErrorMessage(error: unknown): string | null {
  const e = error as { response?: { data?: { message?: string; title?: string } } }
  return e?.response?.data?.message ?? e?.response?.data?.title ?? null
}

/**
 * Edición de detalles de una orden: notas, dirección de envío y costo de
 * domicilio. Prellena desde el detalle completo (GET) y envía un PUT parcial
 * (null = no modificar).
 *
 * Sincronización (según plataforma):
 * - WooCommerce: el backend hace push inmediato de dirección/notas.
 * - Cluvi: su API no expone endpoint para esto (solo productos y estados —
 *   docs/cluvi-api-reference.md); los cambios quedan en PosCo y se avisa.
 */
export function EditOrderDialog({ open, onOpenChange, orderId }: EditOrderDialogProps) {
  const { t } = useTranslation("business-orders")
  const { data: detail, isLoading } = useOrderDetail(open && orderId ? orderId : "")
  const updateDetails = useUpdateOrderDetails()

  const [notes, setNotes] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [shippingNotes, setShippingNotes] = useState("")
  const [shippingCost, setShippingCost] = useState("")

  const [prevDetail, setPrevDetail] = useState(detail)
  if (detail !== prevDetail) {
    setPrevDetail(detail)
    if (detail) {
      setNotes(detail.notes ?? "")
      setStreet(detail.shippingStreet ?? "")
      setCity(detail.shippingCity ?? "")
      setState(detail.shippingState ?? "")
      setZip(detail.shippingZipCode ?? "")
      setShippingNotes(detail.shippingNotes ?? "")
      setShippingCost(detail.shippingCost != null ? String(detail.shippingCost) : "")
    }
  }

  const isFinal = detail?.statusCode === "Cancelled" || detail?.statusCode === "Refunded"
  const canSubmit = Boolean(detail) && !isFinal && !updateDetails.isPending

  const handleSubmit = () => {
    if (!orderId || !canSubmit) return

    const payload: UpdateOrderDetailsDto = {
      notes,
      shippingStreet: street,
      shippingCity: city,
      shippingState: state,
      shippingZipCode: zip,
      shippingLatitude: null,
      shippingLongitude: null,
      shippingNotes,
      shippingCost: shippingCost.trim() === "" ? null : Number(shippingCost),
    }

    updateDetails.mutate(
      { id: orderId, payload },
      {
        onSuccess: () => {
          notify.success(t("order_updated"))
          onOpenChange(false)
        },
        onError: (error) => {
          notify.error(apiErrorMessage(error) ?? t("order_update_error"))
        },
      }
    )
  }

  const platform = detail?.platformCode

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("edit_order")}</DialogTitle>
          <DialogDescription>{t("orders_desc")}</DialogDescription>
        </DialogHeader>

        {isLoading || !detail ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("loading_order")}</p>
        ) : (
          <div className="space-y-4">
            {/* Aviso de sincronización según plataforma */}
            {platform === "CLUVI" ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                {t("cluvi_details_local_only")}
              </p>
            ) : platform === "WOOCOMMERCE" ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                {t("woo_details_sync")}
              </p>
            ) : null}

            {isFinal ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {t("edit_cancelled")}
              </p>
            ) : null}

            {/* Dirección de envío */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("address")}</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} maxLength={300} disabled={isFinal} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shipping_city")}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={150} disabled={isFinal} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shipping_state")}</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} maxLength={150} disabled={isFinal} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shipping_zip")}</Label>
                <Input value={zip} onChange={(e) => setZip(e.target.value)} maxLength={50} disabled={isFinal} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-order-shipping-cost">{t("shipping_cost")}</Label>
                <Input
                  id="edit-order-shipping-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  disabled={isFinal}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>{t("notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={2}
                disabled={isFinal}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("shipping_notes_label")}</Label>
              <Textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                maxLength={1000}
                rows={2}
                disabled={isFinal}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {updateDetails.isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
