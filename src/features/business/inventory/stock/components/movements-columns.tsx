import { Undo2 } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { InventoryMovementDto, MovementType } from "../../types"
import { formatMoney, formatQuantity } from "../../utils/units"

const MOVEMENT_TONES: Record<MovementType, BadgeTone> = {
  PurchaseReceipt: "success",
  TransferIn: "success",
  TransferReturn: "info",
  ProductionOutput: "success",
  TransferOut: "info",
  TransferLoss: "danger",
  ProductionConsumption: "purple",
  SaleConsumption: "primary",
  Waste: "danger",
  CountAdjustment: "warning",
  Reversal: "neutral",
}

// Solo los ajustes de stock que no sean reversa (ni ya anulados) se pueden anular.
const canVoid = (m: InventoryMovementDto) =>
  m.documentType === "StockAdjustment" && m.type !== "Reversal" && !m.isReversed

type MovementColumnActions = {
  onVoid: (movement: InventoryMovementDto) => void
}

export function buildMovementColumns(
  t: (key: string) => string,
  dateFormat: Intl.DateTimeFormat,
  { onVoid }: MovementColumnActions
): ColumnDef<InventoryMovementDto>[] {
  return [
    {
      key: "date",
      header: t("date"),
      minWidth: "min-w-[130px]",
      render: (m) => (
        <span className="whitespace-nowrap text-muted-foreground">{dateFormat.format(new Date(m.occurredAt))}</span>
      ),
    },
    {
      key: "product",
      header: t("product"),
      minWidth: "min-w-[200px]",
      render: (m) => <span className="font-medium text-foreground">{m.itemName}</span>,
    },
    {
      key: "movement",
      header: t("movement"),
      minWidth: "min-w-[220px]",
      render: (m) => (
        <div className="space-y-1">
          <Badge tone={MOVEMENT_TONES[m.type]}>{t(`movement_${m.type}`)}</Badge>
          <p className="text-xs text-muted-foreground">
            {[m.documentNumber, m.reason ? t(`reason_${m.reason}`) : null, m.notes].filter(Boolean).join(" · ")}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: t("quantity"),
      align: "right",
      render: (m) => (
        <span className={m.quantity < 0 ? "font-medium text-destructive" : "font-medium text-emerald-500"}>
          {m.quantity > 0 ? "+" : ""}
          {formatQuantity(m.quantity, m.baseUnit)}
        </span>
      ),
    },
    {
      key: "balance",
      header: t("balance"),
      align: "right",
      render: (m) => <span className="text-muted-foreground">{formatQuantity(m.balanceAfter, m.baseUnit)}</span>,
    },
    {
      key: "cost",
      header: t("cost"),
      align: "right",
      render: (m) => <span className="text-muted-foreground">{formatMoney(m.totalCost)}</span>,
    },
    {
      key: "user",
      header: t("user"),
      responsive: "lg",
      render: (m) => <span className="text-muted-foreground">{m.createdBy ?? "—"}</span>,
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      stickyRight: true,
      render: (m) =>
        canVoid(m) ? (
          <Button variant="ghost" size="sm" onClick={() => onVoid(m)}>
            <Undo2 className="size-4" />
            {t("void")}
          </Button>
        ) : null,
    },
  ]
}
