import { useState } from "react"
import { PackagePlus } from "lucide-react"

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
import type { Branch } from "@/features/business/branches/types"
import { useSuppliers } from "@/features/business/people/suppliers/hooks/use-suppliers"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ProductLinesEditor, type ProductLine } from "../../components/product-lines-editor"
import { useCreateGoodsReceipt } from "../../hooks/use-purchasing"
import { linesAreValid, toLineInputs } from "../../utils/lines"

const NO_SUPPLIER = "none"

type GoodsReceiptDialogProps = {
  branch: Branch
  onOpenChange: (open: boolean) => void
}

/** Entrada rápida: llegó mercancía de un proveedor sin pedido previo. Suma al inventario y actualiza el costo. */
export function GoodsReceiptDialog({ branch, onOpenChange }: GoodsReceiptDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: suppliersData } = useSuppliers()
  const createReceipt = useCreateGoodsReceipt()
  const [supplierId, setSupplierId] = useState(NO_SUPPLIER)
  const [invoice, setInvoice] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<ProductLine[]>([])

  const suppliers = (suppliersData?.items ?? []).filter((s) => !s.inactive)
  const canSubmit = linesAreValid(lines, true) && !createReceipt.isPending

  const submit = () => {
    if (!canSubmit) return
    const inputs = toLineInputs(lines)
    createReceipt.mutate(
      {
        branchId: branch.id,
        supplierId: supplierId === NO_SUPPLIER ? null : supplierId,
        invoiceNumber: invoice.trim() || null,
        notes: notes.trim() || null,
        lines: inputs.map((input, i) => ({ ...input, unitCost: Number(lines[i].unitCost) })),
      },
      {
        onSuccess: (receipt) => {
          notify.success(t("receipt_saved", { number: receipt.number }))
          onOpenChange(false)
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
              <PackagePlus className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("receipt_new_title")}</DialogTitle>
              <DialogDescription>{t("receipt_new_desc", { branch: branch.name })}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entrada-proveedor">{t("receipt_supplier")}</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="entrada-proveedor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>{t("receipt_no_supplier")}</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entrada-factura">{t("receive_invoice")}</Label>
              <Input id="entrada-factura" value={invoice} maxLength={60} onChange={(e) => setInvoice(e.target.value)} />
            </div>
          </div>

          <ProductLinesEditor lines={lines} onChange={setLines} withPrice />

          <div className="space-y-2">
            <Label htmlFor="entrada-nota">{t("notes")}</Label>
            <Textarea
              id="entrada-nota"
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
          <Button id="btn-guardar-entrada" type="button" onClick={submit} disabled={!canSubmit}>
            {createReceipt.isPending ? t("saving") : t("receipt_save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
