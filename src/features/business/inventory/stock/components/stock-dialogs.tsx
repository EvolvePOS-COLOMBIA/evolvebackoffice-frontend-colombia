import { useState } from "react"
import { ClipboardCheck, PackageMinus } from "lucide-react"

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
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useCreateWriteoff, useItemPackagings, useSetStockQuantity } from "../../hooks/use-inventory"
import { QuantityUnitInput } from "../../components/quantity-unit-input"
import type { StockItemDto, WriteoffReason } from "../../types"
import { BASE_UNIT_KEY, formatQuantity, toBaseQuantity, type QuantityUnitValue } from "../../utils/units"

const WRITEOFF_REASONS: WriteoffReason[] = ["Waste", "Expired", "InternalUse", "Consumable"]

type StockDialogProps = {
  branchId: string
  item: StockItemDto | null
  onOpenChange: (open: boolean) => void
}

function defaultQuantity(item: StockItemDto | null): QuantityUnitValue {
  return { amount: "", unitKey: item?.defaultPackaging?.id ?? BASE_UNIT_KEY }
}

function DialogTitleRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof PackageMinus
  title: string
  description: string
}) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  )
}

/** Dar de baja: merma, vencido, consumo interno o consumible. */
export function WriteoffDialog({ branchId, item, onOpenChange }: StockDialogProps) {
  const { t } = useTranslation("business-inventory")
  const writeoff = useCreateWriteoff()
  const { data: packagings = [] } = useItemPackagings(item?.itemId ?? null)
  const [quantity, setQuantity] = useState<QuantityUnitValue>(() => defaultQuantity(item))
  const [reason, setReason] = useState<WriteoffReason>("Waste")
  const [notes, setNotes] = useState("")

  if (!item) return null
  const baseQuantity = toBaseQuantity(quantity, packagings)
  const exceeds = baseQuantity !== null && baseQuantity > item.quantity
  const canSubmit = baseQuantity !== null && baseQuantity > 0 && !exceeds && !writeoff.isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    writeoff.mutate(
      {
        branchId,
        reason,
        notes: notes.trim() || null,
        lines: [
          {
            itemId: item.itemId,
            quantity: Number(quantity.amount),
            packagingId: quantity.unitKey === BASE_UNIT_KEY ? null : quantity.unitKey,
          },
        ],
      },
      {
        onSuccess: (doc) => {
          notify.success(t("writeoff_done", { number: doc.number }))
          onOpenChange(false)
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogTitleRow icon={PackageMinus} title={t("writeoff_title")} description={item.itemName} />
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("current_stock")}:{" "}
            <span className="font-medium text-foreground">{formatQuantity(item.quantity, item.baseUnit)}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="baja-cantidad">{t("quantity")}</Label>
            <QuantityUnitInput
              id="baja-cantidad"
              itemId={item.itemId}
              baseUnit={item.baseUnit}
              value={quantity}
              onChange={setQuantity}
            />
            {exceeds ? <p className="text-xs font-medium text-destructive">{t("writeoff_exceeds")}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="baja-motivo">{t("reason")}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as WriteoffReason)}>
              <SelectTrigger id="baja-motivo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WRITEOFF_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`reason_${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="baja-nota">{t("notes")}</Label>
            <Textarea
              id="baja-nota"
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
          <Button id="btn-dar-de-baja" type="button" variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            {writeoff.isPending ? t("saving") : t("writeoff_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Corregir saldo: deja el producto con lo que se contó. */
export function SetQuantityDialog({ branchId, item, onOpenChange }: StockDialogProps) {
  const { t } = useTranslation("business-inventory")
  const setQuantityMutation = useSetStockQuantity()
  const { data: packagings = [] } = useItemPackagings(item?.itemId ?? null)
  const [quantity, setQuantity] = useState<QuantityUnitValue>(() => defaultQuantity(item))
  const [notes, setNotes] = useState("")

  if (!item) return null
  const baseQuantity = toBaseQuantity(quantity, packagings)
  const difference = baseQuantity === null ? null : baseQuantity - item.quantity
  const canSubmit = baseQuantity !== null && baseQuantity >= 0 && difference !== 0 && !setQuantityMutation.isPending

  const handleSubmit = () => {
    if (!canSubmit || baseQuantity === null) return
    setQuantityMutation.mutate(
      { branchId, itemId: item.itemId, quantity: baseQuantity, notes: notes.trim() || null },
      {
        onSuccess: (doc) => {
          notify.success(t("correction_done", { number: doc.number }))
          onOpenChange(false)
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogTitleRow icon={ClipboardCheck} title={t("correction_title")} description={item.itemName} />
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("correction_desc")}</p>
          <p className="text-sm text-muted-foreground">
            {t("system_says")}:{" "}
            <span className="font-medium text-foreground">{formatQuantity(item.quantity, item.baseUnit)}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="correccion-cantidad">{t("counted")}</Label>
            <QuantityUnitInput
              id="correccion-cantidad"
              itemId={item.itemId}
              baseUnit={item.baseUnit}
              value={quantity}
              onChange={setQuantity}
            />
            {difference !== null && difference !== 0 ? (
              <p
                className={
                  difference < 0 ? "text-xs font-medium text-destructive" : "text-xs font-medium text-emerald-500"
                }
              >
                {difference < 0 ? t("missing") : t("surplus")}: {formatQuantity(Math.abs(difference), item.baseUnit)}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="correccion-nota">{t("notes")}</Label>
            <Textarea
              id="correccion-nota"
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
          <Button id="btn-corregir-saldo" type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {setQuantityMutation.isPending ? t("saving") : t("correction_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
