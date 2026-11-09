import { Bike, Wallet } from "lucide-react"

import { Badge, type BadgeTone } from "@/components/ui/badge"
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
import { StatTile } from "@/components/share/stat-tile"
import { useTranslation } from "@/i18n/use-i18n"
import { formatCurrency, formatDateTime } from "@/utils/format"
import { useShiftDetail } from "../hooks/use-delivery"
import { movementSign, type DeliveryMovementType, type DeliveryShiftDto } from "../types"

type ShiftDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftId: string | null
  /** Acciones disponibles sobre el turno abierto (se ocultan si está cerrado). */
  onExtraBase?: (shift: DeliveryShiftDto) => void
  onPickup?: (shift: DeliveryShiftDto) => void
  onDeliverOrders?: (shift: DeliveryShiftDto) => void
  onCloseShift?: (shift: DeliveryShiftDto) => void
}

/**
 * Detalle de un turno de domiciliario: resumen (base, dinero esperado en mano),
 * libro de efectivo completo y acciones del turno abierto (más base, recogida,
 * entregar pedidos, cerrar turno).
 */
export function ShiftDetailDialog({
  open,
  onOpenChange,
  shiftId,
  onExtraBase,
  onPickup,
  onDeliverOrders,
  onCloseShift,
}: ShiftDetailDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const { data, isLoading } = useShiftDetail(open ? shiftId : null)

  const shift = data?.shift
  const movements = data?.movements ?? []
  const isOpen = shift?.status === "Open"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("shift_detail_title")}
            {shift?.domiciliarioName ? ` · ${shift.domiciliarioName}` : ""}
          </DialogTitle>
          <DialogDescription>
            {shift ? `${shift.branchName ?? ""} · ${formatDateTime(shift.openedAt)}` : t("movements_empty")}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !shift ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <StatTile label={t("shift_base")} value={formatCurrency(shift.baseAmount)} icon={Wallet} />
              <StatTile
                label={t("shift_expected_cash")}
                value={formatCurrency(shift.expectedCash)}
                icon={Wallet}
                tone="primary"
              />
              <StatTile label={t("movements_count")} value={movements.length} icon={Bike} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/70">
              <div className="border-b border-border/70 px-4 py-2.5">
                <h3 className="text-sm font-semibold">{t("movements_title")}</h3>
              </div>
              {movements.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("movements_empty")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("movement_date")}</TableHead>
                      <TableHead>{t("movement_type")}</TableHead>
                      <TableHead>{t("movement_order")}</TableHead>
                      <TableHead>{t("movement_notes")}</TableHead>
                      <TableHead className="text-right">{t("movement_amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => {
                      const sign = movementSign(m.type)
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                            {formatDateTime(m.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={MOVEMENT_TONES[m.type] ?? "neutral"} className="text-[10px]">
                              {movementLabel(m.type, t)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {m.orderId ? `#${m.orderId.slice(0, 8)}` : "—"}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                            {m.notes ?? "—"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${sign < 0 ? "text-destructive" : "text-foreground"}`}
                          >
                            {sign < 0 ? "−" : "+"}
                            {formatCurrency(m.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {isOpen ? (
              <div className="flex flex-wrap gap-2">
                {onExtraBase ? (
                  <Button variant="outline" size="sm" onClick={() => onExtraBase(shift)}>
                    {t("extra_base")}
                  </Button>
                ) : null}
                {onPickup ? (
                  <Button variant="outline" size="sm" onClick={() => onPickup(shift)}>
                    {t("pickup")}
                  </Button>
                ) : null}
                {onDeliverOrders ? (
                  <Button variant="outline" size="sm" onClick={() => onDeliverOrders(shift)}>
                    {t("deliver_orders")}
                  </Button>
                ) : null}
                {onCloseShift ? (
                  <Button variant="destructive" size="sm" onClick={() => onCloseShift(shift)}>
                    {t("close_shift")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const MOVEMENT_TONES: Record<DeliveryMovementType, BadgeTone> = {
  BaseAssigned: "success",
  ExtraBase: "info",
  PartialPickup: "warning",
  OrderAdvance: "purple",
  DeliveryCollection: "success",
  AdvanceRefund: "orange",
}

function movementLabel(type: DeliveryMovementType, t: (key: string) => string): string {
  switch (type) {
    case "BaseAssigned":
      return t("movement_base_assigned")
    case "ExtraBase":
      return t("movement_extra_base")
    case "PartialPickup":
      return t("movement_partial_pickup")
    case "OrderAdvance":
      return t("movement_order_advance")
    case "DeliveryCollection":
      return t("movement_delivery_collection")
    case "AdvanceRefund":
      return t("movement_advance_refund")
    default:
      return type
  }
}
