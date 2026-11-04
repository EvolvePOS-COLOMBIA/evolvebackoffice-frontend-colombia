import { CircleEllipsis, ClipboardCheck, History, PackageMinus } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { StockItemDto } from "../../types"
import { formatInPackaging, formatMoney, formatQuantity, formatUnitCost, unitSymbol } from "../../utils/units"

type StockColumnActions = {
  onHistory: (item: StockItemDto) => void
  onWriteoff: (item: StockItemDto) => void
  onCorrection: (item: StockItemDto) => void
}

export function buildStockColumns(
  t: (key: string) => string,
  { onHistory, onWriteoff, onCorrection }: StockColumnActions
): ColumnDef<StockItemDto>[] {
  return [
    {
      key: "product",
      header: t("product"),
      minWidth: "min-w-[220px]",
      render: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.itemName}</p>
          <p className="text-xs text-muted-foreground">
            {[item.sku, item.departmentName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "on_hand",
      header: t("on_hand"),
      align: "right",
      render: (item) => (
        <>
          <p className={item.quantity < 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>
            {formatQuantity(item.quantity, item.baseUnit)}
          </p>
          {formatInPackaging(item.quantity, item.defaultPackaging) ? (
            <p className="text-xs text-muted-foreground">{formatInPackaging(item.quantity, item.defaultPackaging)}</p>
          ) : null}
        </>
      ),
    },
    {
      key: "avg_cost",
      header: t("avg_cost"),
      align: "right",
      responsive: "md",
      render: (item) => (
        <span className="text-muted-foreground">
          {formatUnitCost(item.cost)} / {unitSymbol(item.baseUnit)}
        </span>
      ),
    },
    {
      key: "value",
      header: t("value"),
      align: "right",
      render: (item) => <span className="text-foreground">{formatMoney(item.value)}</span>,
    },
    {
      key: "min_short",
      header: t("min_short"),
      align: "right",
      responsive: "md",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.reorderPoint > 0 ? formatQuantity(item.reorderPoint, item.baseUnit) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (item) => (
        <Badge tone={item.quantity < 0 ? "danger" : item.isBelowMin ? "warning" : "success"}>
          {item.quantity < 0 ? t("status_negative") : item.isBelowMin ? t("status_below_min") : t("status_ok")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      stickyRight: true,
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={t("actions")}>
              <CircleEllipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onHistory(item)}>
              <History className="size-4" />
              {t("action_history")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onWriteoff(item)}>
              <PackageMinus className="size-4" />
              {t("action_writeoff")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCorrection(item)}>
              <ClipboardCheck className="size-4" />
              {t("action_correction")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
