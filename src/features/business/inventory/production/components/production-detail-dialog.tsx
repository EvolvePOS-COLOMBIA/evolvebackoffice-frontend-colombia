import { useState } from "react"
import { Ban, ChefHat, XCircle } from "lucide-react"

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
import { useCancelProduction, useProductionOrder, useVoidProduction } from "../../hooks/use-production"
import type { ProductionOrderDto } from "../../types/production"
import { formatDateTime, PRODUCTION_STATUS_TONE } from "../../utils/status"
import { formatMoney, formatQuantity, formatUnitCost, unitSymbol } from "../../utils/units"

type ProductionDetailDialogProps = {
  productionId: string
  onOpenChange: (open: boolean) => void
  onComplete: (order: ProductionOrderDto) => void
}

export function ProductionDetailDialog({ productionId, onOpenChange, onComplete }: ProductionDetailDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: order, isLoading } = useProductionOrder(productionId)
  const [confirm, setConfirm] = useState<"cancel" | "void" | null>(null)
  const cancel = useCancelProduction()
  const voidProduction = useVoidProduction()

  if (isLoading || !order) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("production_detail")}</DialogTitle>
          </DialogHeader>
          <Skeleton className="h-48 w-full" />
        </DialogContent>
      </Dialog>
    )
  }

  const done = order.status === "Completed" || order.status === "Voided"
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <ChefHat className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {order.number}
                <Badge tone={PRODUCTION_STATUS_TONE[order.status]}>{t(`production_status_${order.status}`)}</Badge>
              </DialogTitle>
              <DialogDescription>
                {order.branchName} · {formatDateTime(order.completedAt ?? order.createdAt)}
                {order.completedBy ? ` · ${order.completedBy}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {order.products.map((p) => (
          <div key={p.itemId} className="space-y-3 rounded-xl border border-border/70 p-3">
            <p className="font-medium text-foreground">{p.itemName}</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label={t("production_planned_qty")} value={formatQuantity(p.plannedQuantity, p.baseUnit)} />
              <Stat
                label={t("production_produced_qty")}
                value={p.producedQuantity === null ? "—" : formatQuantity(p.producedQuantity, p.baseUnit)}
              />
              <Stat
                label={t("production_efficiency")}
                value={p.efficiency === null ? "—" : `${Math.round(p.efficiency * 100)} %`}
              />
              <Stat
                label={t("production_unit_cost_short")}
                value={done ? `${formatUnitCost(p.unitCost)} / ${unitSymbol(p.baseUnit)}` : "—"}
              />
            </div>

            <div className="w-full overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("production_ingredient")}</TableHead>
                    <TableHead className="text-right">{t("production_recipe_says")}</TableHead>
                    <TableHead className="text-right">{t("production_used")}</TableHead>
                    <TableHead className="text-right">{t("cost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.lines.map((l) => (
                    <TableRow key={l.itemId}>
                      <TableCell className="font-medium text-foreground">{l.itemName}</TableCell>
                      <TableCell className="text-right">{formatQuantity(l.theoreticalQuantity, l.baseUnit)}</TableCell>
                      <TableCell className="text-right">
                        {l.actualQuantity === null ? "—" : formatQuantity(l.actualQuantity, l.baseUnit)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {done ? formatMoney(l.totalCost) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {t("production_order_cost")}:{" "}
            <span className="font-medium text-foreground">{done ? formatMoney(order.totalCost) : "—"}</span>
          </span>
          {order.notes ? <span>{order.notes}</span> : null}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {order.status === "Planned" ? (
            <>
              <Button type="button" variant="outline" onClick={() => setConfirm("cancel")}>
                <XCircle className="mr-2 size-4" />
                {t("production_cancel")}
              </Button>
              <Button type="button" onClick={() => onComplete(order)}>
                <ChefHat className="mr-2 size-4" />
                {t("production_register")}
              </Button>
            </>
          ) : null}
          {order.status === "Completed" ? (
            <Button type="button" variant="outline" onClick={() => setConfirm("void")}>
              <Ban className="mr-2 size-4" />
              {t("void")}
            </Button>
          ) : null}
        </DialogFooter>

        <ConfirmActionDialog
          open={confirm !== null}
          onOpenChange={(open) => !open && setConfirm(null)}
          title={confirm === "void" ? t("production_void_title") : t("production_cancel_title")}
          description={
            confirm === "void" ? t("production_void_desc", { number: order.number }) : t("production_cancel_desc")
          }
          confirmLabel={confirm === "void" ? t("void") : t("production_cancel")}
          tone="destructive"
          isPending={cancel.isPending || voidProduction.isPending}
          onConfirm={() =>
            (confirm === "void" ? voidProduction : cancel).mutate(order.id, {
              onSuccess: () => setConfirm(null),
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
