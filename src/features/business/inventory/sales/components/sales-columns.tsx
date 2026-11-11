import { Eye } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { WholesaleSaleDto } from "../../types/sales"
import { formatDateTime } from "../../utils/status"
import { formatMoney } from "../../utils/units"

type SaleColumnActions = {
  onView: (sale: WholesaleSaleDto) => void
}

export function buildSaleColumns(
  t: (key: string) => string,
  { onView }: SaleColumnActions
): ColumnDef<WholesaleSaleDto>[] {
  return [
    {
      key: "document",
      header: t("document"),
      minWidth: "min-w-[140px]",
      render: (sale) => <span className="font-medium text-foreground">{sale.number}</span>,
    },
    {
      key: "customer",
      header: t("sale_customer"),
      minWidth: "min-w-[170px]",
      render: (sale) => <span className="text-muted-foreground">{sale.customerName ?? t("sale_customer_none")}</span>,
    },
    {
      key: "date",
      header: t("date"),
      minWidth: "min-w-[150px]",
      responsive: "sm",
      render: (sale) => <span className="text-muted-foreground">{formatDateTime(sale.createdAt)}</span>,
    },
    {
      key: "total",
      header: t("sale_total"),
      minWidth: "min-w-[110px]",
      align: "right",
      render: (sale) => formatMoney(sale.total),
    },
    {
      key: "profit",
      header: t("sale_profit"),
      minWidth: "min-w-[120px]",
      align: "right",
      render: (sale) => (
        <>
          {formatMoney(sale.profit)}
          {sale.profitPercent !== null ? <p className="text-xs text-muted-foreground">{sale.profitPercent} %</p> : null}
        </>
      ),
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[110px]",
      render: (sale) =>
        sale.status === "Voided" ? (
          <Badge tone="danger">{t("receipt_voided")}</Badge>
        ) : (
          <Badge tone="success">{t("sale_status_applied")}</Badge>
        ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (sale) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onView(sale)}
            aria-label={t("sale_view_action")}
            title={t("sale_view_action")}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}
