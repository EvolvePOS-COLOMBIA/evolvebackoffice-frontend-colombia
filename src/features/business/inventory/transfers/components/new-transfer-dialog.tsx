import { useState } from "react"
import { Truck } from "lucide-react"

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
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ProductLinesEditor, type ProductLine } from "../../components/product-lines-editor"
import { useCreateTransfer } from "../../hooks/use-purchasing"
import { getItemPrice } from "../../services/sales.service"
import type { TransferDto } from "../../types/purchasing"
import { linesAreValid, toLineInputs } from "../../utils/lines"

type NewTransferDialogProps = {
  branch: Branch
  branches: Branch[]
  onOpenChange: (open: boolean) => void
  onCreated: (transfer: TransferDto) => void
}

/**
 * Envío sin pedido. La proveedora le envía a cualquier sucursal; las demás solo a una proveedora
 * (a otra sucursal le envían despachando el pedido que les hizo).
 */
export function NewTransferDialog({ branch, branches, onOpenChange, onCreated }: NewTransferDialogProps) {
  const { t } = useTranslation("business-inventory")
  const createTransfer = useCreateTransfer()
  const [toBranchId, setToBranchId] = useState("")
  const [lines, setLines] = useState<ProductLine[]>([])
  const [notes, setNotes] = useState("")

  const destinations = branches.filter((b) => b.id !== branch.id && b.isActive && (branch.isSupplier || b.isSupplier))
  // Un precio especial o un % sin valor válido no deja enviar (el backend usaría otro precio).
  const pricesValid = lines.every(
    (l) => !l.linePrice || l.linePrice.mode === "sale" || l.linePrice.mode === "cost" || Boolean(l.unitCost)
  )
  const canSubmit = Boolean(toBranchId) && linesAreValid(lines) && pricesValid && !createTransfer.isPending

  const submit = () => {
    if (!canSubmit) return
    createTransfer.mutate(
      {
        fromBranchId: branch.id,
        toBranchId,
        // Sin precio (no tiene precio de venta y se dejó así) → el backend lo envía al costo.
        lines: toLineInputs(lines).map((input, i) => ({
          ...input,
          unitPrice: lines[i].unitCost ? Number(lines[i].unitCost) : null,
        })),
        notes: notes.trim() || null,
      },
      {
        onSuccess: (transfer) => {
          notify.success(t("transfer_created", { number: transfer.number }))
          onCreated(transfer)
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
              <Truck className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("transfer_new_title")}</DialogTitle>
              <DialogDescription>{t("transfer_new_desc", { branch: branch.name })}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="envio-destino">{t("transfer_to")}</Label>
            <Select value={toBranchId} onValueChange={setToBranchId}>
              <SelectTrigger id="envio-destino">
                <SelectValue placeholder={t("transfer_to_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.isSupplier ? `${b.name} · ${t("supplier_branch")}` : b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!branch.isSupplier ? (
              <p className="text-xs text-muted-foreground">{t("transfer_only_to_supplier")}</p>
            ) : null}
          </div>

          <ProductLinesEditor
            lines={lines}
            onChange={setLines}
            stockBranchId={branch.id}
            priceMode={{ noBaseLabel: t("price_at_cost") }}
            priceFor={(itemId) => getItemPrice(branch.id, itemId)}
          />
          <p className="text-xs text-muted-foreground">{t("transfer_stock_hint")}</p>

          <div className="space-y-2">
            <Label htmlFor="envio-nota">{t("notes")}</Label>
            <Textarea
              id="envio-nota"
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
          <Button id="btn-crear-envio" type="button" onClick={submit} disabled={!canSubmit}>
            {createTransfer.isPending ? t("saving") : t("transfer_send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
