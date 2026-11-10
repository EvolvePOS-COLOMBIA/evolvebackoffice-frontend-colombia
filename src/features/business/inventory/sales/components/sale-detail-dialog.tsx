import { useState } from "react"
import { Ban, Receipt } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ShareButton } from "../../components/share-dialog"
import { useSale, useVoidSale } from "../../hooks/use-sales"
import { saleShareText } from "../../utils/share-text"
import { formatDateTime } from "../../utils/status"
import { formatInPackaging, formatMoney, formatQuantity } from "../../utils/units"

type SaleDetailDialogProps = {
  saleId: string
  onOpenChange: (open: boolean) => void
}

export function SaleDetailDialog({ saleId, onOpenChange }: SaleDetailDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: sale, isLoading } = useSale(saleId)
  const voidSale = useVoidSale()
  const [confirm, setConfirm] = useState(false)

  if (isLoading || !sale) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("sale_detail")}</DialogTitle>
          </DialogHeader>
          <Skeleton className="h-48 w-full" />
        </DialogContent>
      </Dialog>
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
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {sale.number}
                {sale.status === "Voided" ? <Badge tone="danger">{t("receipt_voided")}</Badge> : null}
              </DialogTitle>
              <DialogDescription>
                {sale.branchName} · {sale.customerName ?? t("sale_customer_none")} · {formatDateTime(sale.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("sale_line_total")}</TableHead>
                <TableHead className="text-right">{t("cost")}</TableHead>
                <TableHead className="text-right">{t("sale_profit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.lines.map((l) => {
                const packaging =
                  l.packagingName && l.packagingFactor ? { name: l.packagingName, factor: l.packagingFactor } : null
                return (
                  <TableRow key={l.itemId}>
                    <TableCell>
                      <p className="font-medium text-foreground">{l.itemName}</p>
                      <p className="text-xs text-muted-foreground">{l.sku ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p>{formatQuantity(l.quantity, l.baseUnit)}</p>
                      {formatInPackaging(l.quantity, packaging) ? (
                        <p className="text-xs text-muted-foreground">{formatInPackaging(l.quantity, packaging)}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(l.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatMoney(l.quantity * l.unitCost)}
                    </TableCell>
                    <TableCell className={l.profit < 0 ? "text-right text-destructive" : "text-right"}>
                      {formatMoney(l.profit)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={t("sale_total")} value={formatMoney(sale.total)} />
          <Stat label={t("sale_cost_total")} value={formatMoney(sale.totalCost)} />
          <Stat
            label={t("sale_profit_net")}
            value={`${formatMoney(sale.profit)}${sale.profitPercent !== null ? ` · ${sale.profitPercent} %` : ""}`}
          />
        </div>
        {sale.notes ? <p className="text-sm text-muted-foreground">{sale.notes}</p> : null}

        <DialogFooter className="flex-wrap gap-2">
          <ShareButton title={sale.number} text={saleShareText(sale, t)} phone={sale.customerPhone} />
          {sale.status === "Applied" ? (
            <Button type="button" variant="outline" onClick={() => setConfirm(true)}>
              <Ban className="mr-2 size-4" />
              {t("void")}
            </Button>
          ) : null}
        </DialogFooter>

        <ConfirmActionDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("sale_void_title")}
          description={t("sale_void_desc", { number: sale.number })}
          confirmLabel={t("void")}
          tone="destructive"
          isPending={voidSale.isPending}
          onConfirm={() =>
            voidSale.mutate(sale.id, {
              onSuccess: () => setConfirm(false),
              onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
