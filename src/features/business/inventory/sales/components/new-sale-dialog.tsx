import { useState } from "react"
import { Receipt } from "lucide-react"

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
import { useUsers } from "@/features/business/people/users/hooks/use-users"
import { getUserDisplayName } from "@/features/business/people/users/types"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ProductLinesEditor, type ProductLine } from "../../components/product-lines-editor"
import { useCreateSale } from "../../hooks/use-sales"
import { getItemPrice } from "../../services/sales.service"
import type { WholesaleSaleDto } from "../../types/sales"
import { linesAreValid, toLineInputs } from "../../utils/lines"
import { formatMoney } from "../../utils/units"

const NO_EMPLOYEE = "none"

type NewSaleDialogProps = {
  branch: Branch
  onOpenChange: (open: boolean) => void
  onCreated: (sale: WholesaleSaleDto) => void
}

/** Empleado → productos (con el precio de la sucursal ya propuesto) → Registrar venta. */
export function NewSaleDialog({ branch, onOpenChange, onCreated }: NewSaleDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: usersData } = useUsers()
  const createSale = useCreateSale()
  const [employeeId, setEmployeeId] = useState(NO_EMPLOYEE)
  const [employeeName, setEmployeeName] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<ProductLine[]>([])

  const employees = (usersData ?? []).filter((u) => u.isActive)
  const selectedEmployee = employees.find((u) => u.id === employeeId) ?? null
  const total = lines.reduce((sum, l) => sum + (Number(l.quantity.amount) || 0) * (Number(l.unitCost) || 0), 0)
  const canSubmit = linesAreValid(lines, true) && !createSale.isPending

  const submit = () => {
    if (!canSubmit) return
    const inputs = toLineInputs(lines)
    createSale.mutate(
      {
        branchId: branch.id,
        // El DTO del backend solo ofrece customerId (uuid de Customers) o customerName;
        // no existe campo para el id de usuario, así que va el nombre del empleado.
        customerId: null,
        customerName: selectedEmployee ? getUserDisplayName(selectedEmployee) : employeeName.trim() || null,
        notes: notes.trim() || null,
        lines: inputs.map((input, i) => ({ ...input, unitPrice: Number(lines[i].unitCost) })),
      },
      {
        onSuccess: (sale) => {
          notify.success(t("sale_saved", { number: sale.number }))
          onCreated(sale)
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
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("sale_new_title")}</DialogTitle>
              <DialogDescription>{t("sale_new_desc", { branch: branch.name })}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venta-empleado">{t("sale_customer")}</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="venta-empleado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EMPLOYEE}>{t("sale_customer_free")}</SelectItem>
                  {employees.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserDisplayName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {employeeId === NO_EMPLOYEE ? (
              <div className="space-y-2">
                <Label htmlFor="venta-empleado-nombre">{t("sale_customer_name")}</Label>
                <Input
                  id="venta-empleado-nombre"
                  value={employeeName}
                  maxLength={200}
                  placeholder={t("sale_customer_name_placeholder")}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <ProductLinesEditor
            lines={lines}
            onChange={setLines}
            priceMode={{ noBaseLabel: t("price_no_sale_price") }}
            includeRecipeItems
            priceFor={(itemId) => getItemPrice(branch.id, itemId)}
          />
          <p className="text-xs text-muted-foreground">{t("sale_stock_hint")}</p>

          <div className="space-y-2">
            <Label htmlFor="venta-nota">{t("notes")}</Label>
            <Textarea
              id="venta-nota"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap items-center gap-2 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {t("sale_total")}: <span className="font-medium text-foreground">{formatMoney(total)}</span>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button id="btn-registrar-venta" type="button" onClick={submit} disabled={!canSubmit}>
              {createSale.isPending ? t("saving") : t("sale_save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
