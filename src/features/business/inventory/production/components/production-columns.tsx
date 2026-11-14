import { Eye } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ProductionOrderSummaryDto } from "../../types/production"
import { formatDateTime, PRODUCTION_STATUS_TONE } from "../../utils/status"
import { formatMoney, formatQuantity } from "../../utils/units"

type ProductionColumnsActions = {
  onOpen: (order: ProductionOrderSummaryDto) => void
}

export function buildProductionColumns(
  t: (key: string) => string,
  { onOpen }: ProductionColumnsActions
): ColumnDef<ProductionOrderSummaryDto>[] {
  return [
    {
      key: "document",
      header: t("document"),
      minWidth: "min-w-[140px]",
      // Plain text cell; the detail opens from the actions button.
      render: (order) => <span className="font-medium text-foreground">{order.number}</span>,
    },
    {
      key: "products",
      header: t("production_products"),
      minWidth: "min-w-[220px]",
      render: (order) => (
        <ul className="space-y-0.5">
          {order.products.map((product) => (
            <li key={product.itemId}>
              {product.itemName}{" "}
              <span className="text-muted-foreground">
                · {formatQuantity(product.producedQuantity ?? product.plannedQuantity, product.baseUnit)}
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "date",
      header: t("date"),
      responsive: "sm",
      render: (order) => (
        <span className="text-muted-foreground">{formatDateTime(order.completedAt ?? order.createdAt)}</span>
      ),
    },
    {
      key: "value",
      header: t("value"),
      align: "right",
      render: (order) => (order.status === "Planned" ? "—" : formatMoney(order.totalCost)),
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[110px]",
      render: (order) => (
        <Badge tone={PRODUCTION_STATUS_TONE[order.status]}>{t(`production_status_${order.status}`)}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      minWidth: "min-w-[90px]",
      render: (order) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onOpen(order)}
            aria-label={t("production_view_action")}
            title={t("production_view_action")}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}
