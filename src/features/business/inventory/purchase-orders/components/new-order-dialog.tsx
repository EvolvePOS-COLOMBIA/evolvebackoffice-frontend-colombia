import { useState } from "react"
import { History, ShoppingCart, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Branch } from "@/features/business/branches/types"
import { useSuppliers } from "@/features/business/people/suppliers/hooks/use-suppliers"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ProductLinesEditor, type ProductLine } from "../../components/product-lines-editor"
import { useCreatePurchaseOrder } from "../../hooks/use-purchasing"
import { getLastOrderLines, getOrderSuggestion } from "../../services/purchasing.service"
import type { PurchaseOrderDto } from "../../types/purchasing"
import { linesAreValid, toLineInputs } from "../../utils/lines"
import { BASE_UNIT_KEY } from "../../utils/units"

type NewOrderDialogProps = {
  /** branch = pedido a otra sucursal (PED) · supplier = orden de compra a un proveedor (OC). */
  kind: "branch" | "supplier"
  branch: Branch
  branches: Branch[]
  onOpenChange: (open: boolean) => void
  onCreated: (order: PurchaseOrderDto) => void
}

/** "¿A quién le pides?" → productos (sugeridos o del último pedido) → Enviar. */
export function NewOrderDialog({ kind: orderKind, branch, branches, onOpenChange, onCreated }: NewOrderDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: suppliersData } = useSuppliers()
  const createOrder = useCreatePurchaseOrder()
  const [target, setTarget] = useState("")
  const [lines, setLines] = useState<ProductLine[]>([])
  const [notes, setNotes] = useState("")
  const [loadingHelper, setLoadingHelper] = useState(false)

  // A cualquier otra sucursal (primero las proveedoras); las órdenes de compra, a proveedores activos.
  const otherBranches =
    orderKind === "branch"
      ? branches
          .filter((b) => b.id !== branch.id && b.isActive)
          .sort((a, b) => Number(b.isSupplier) - Number(a.isSupplier))
      : []
  const externalSuppliers = orderKind === "supplier" ? (suppliersData?.items ?? []).filter((s) => !s.inactive) : []
  const [kind, targetId] = target.split(":") as ["branch" | "supplier" | "", string | undefined]
  const supplierBranchId = kind === "branch" ? (targetId ?? null) : null
  const supplierId = kind === "supplier" ? (targetId ?? null) : null
  const canSubmit = Boolean(targetId) && linesAreValid(lines) && !createOrder.isPending

  const useSuggestion = async () => {
    setLoadingHelper(true)
    try {
      const suggested = await getOrderSuggestion(branch.id, supplierBranchId)
      if (suggested.length === 0) {
        notify.info(t("order_no_suggestion"))
        return
      }
      setLines(
        suggested.map((s) => {
          const usePackaging = s.packagingId && s.packagingFactor
          return {
            itemId: s.itemId,
            name: s.itemName,
            sku: s.sku,
            baseUnit: s.baseUnit,
            quantity: usePackaging
              ? { amount: String(Math.ceil(s.suggestedQuantity / s.packagingFactor!)), unitKey: s.packagingId! }
              : { amount: String(Math.ceil(s.suggestedQuantity)), unitKey: BASE_UNIT_KEY },
          }
        })
      )
    } catch (error) {
      notify.error(getApiErrorMessage(error, t("save_error")))
    } finally {
      setLoadingHelper(false)
    }
  }

  const repeatLast = async () => {
    setLoadingHelper(true)
    try {
      const last = await getLastOrderLines(branch.id, supplierBranchId, supplierId)
      if (last.length === 0) {
        notify.info(t("order_no_last"))
        return
      }
      setLines(
        last.map((l) => ({
          itemId: l.itemId,
          name: l.itemName,
          sku: l.sku,
          baseUnit: l.baseUnit,
          quantity: { amount: String(l.quantity), unitKey: l.packagingId ?? BASE_UNIT_KEY },
        }))
      )
    } catch (error) {
      notify.error(getApiErrorMessage(error, t("save_error")))
    } finally {
      setLoadingHelper(false)
    }
  }

  const submit = (send: boolean) => {
    if (!canSubmit) return
    createOrder.mutate(
      {
        branchId: branch.id,
        supplierBranchId,
        supplierId,
        lines: toLineInputs(lines),
        notes: notes.trim() || null,
        send,
      },
      {
        onSuccess: (order) => {
          notify.success(send ? t("order_sent", { number: order.number }) : t("order_saved", { number: order.number }))
          onCreated(order)
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <DialogTitle>{orderKind === "branch" ? t("order_new_title") : t("po_new_title")}</DialogTitle>
              <DialogDescription>
                {orderKind === "branch"
                  ? t("order_new_desc", { branch: branch.name })
                  : t("po_new_desc", { branch: branch.name })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pedido-proveedor">{orderKind === "branch" ? t("order_who") : t("po_who")}</Label>
            {/* Bloqueado mientras carga "Sugerido" / "Repetir último": las líneas son de este proveedor. */}
            <Select value={target} onValueChange={setTarget} disabled={loadingHelper}>
              <SelectTrigger id="pedido-proveedor">
                <SelectValue
                  placeholder={orderKind === "branch" ? t("order_who_placeholder") : t("po_who_placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {otherBranches.map((b) => (
                  <SelectItem key={b.id} value={`branch:${b.id}`}>
                    {b.isSupplier ? `${b.name} · ${t("supplier_branch")}` : b.name}
                  </SelectItem>
                ))}
                {externalSuppliers.map((s) => (
                  <SelectItem key={s.id} value={`supplier:${s.id}`}>
                    {s.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orderKind === "supplier" && externalSuppliers.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("po_no_suppliers")}</p>
            ) : null}
          </div>

          {targetId ? (
            <div className="flex flex-wrap gap-2">
              {supplierBranchId ? (
                <Button type="button" variant="outline" size="sm" onClick={useSuggestion} disabled={loadingHelper}>
                  <Sparkles className="mr-2 size-4" />
                  {t("order_use_suggestion")}
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={repeatLast} disabled={loadingHelper}>
                <History className="mr-2 size-4" />
                {t("order_repeat_last")}
              </Button>
            </div>
          ) : null}

          <ProductLinesEditor lines={lines} onChange={setLines} />

          <div className="space-y-2">
            <Label htmlFor="pedido-nota">{t("notes")}</Label>
            <Textarea
              id="pedido-nota"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="outline" onClick={() => submit(false)} disabled={!canSubmit}>
            {t("order_save_draft")}
          </Button>
          <Button id="btn-enviar-pedido" type="button" onClick={() => submit(true)} disabled={!canSubmit}>
            {createOrder.isPending ? t("saving") : orderKind === "branch" ? t("order_send") : t("po_send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
