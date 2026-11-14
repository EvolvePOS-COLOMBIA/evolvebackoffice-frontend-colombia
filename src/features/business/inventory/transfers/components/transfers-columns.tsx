import { ArrowRight, Eye } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TransferSummaryDto } from "../../types/purchasing"
import { formatDateTime, TRANSFER_STATUS_TONE } from "../../utils/status"
import { formatMoney } from "../../utils/units"

type TransferColumnsActions = {
  onOpen: (transfer: TransferSummaryDto) => void
}

export function buildTransferColumns(
  t: (key: string, params?: Record<string, string | number>) => string,
  { onOpen }: TransferColumnsActions
): ColumnDef<TransferSummaryDto>[] {
  return [
    {
      key: "document",
      header: t("document"),
      minWidth: "min-w-[160px]",
      render: (transfer) => (
        <>
          <p className="font-medium text-foreground">{transfer.number}</p>
          <p className="text-xs text-muted-foreground">
            {transfer.purchaseOrderNumber
              ? t("transfers_for_order", { number: transfer.purchaseOrderNumber })
              : t("transfers_without_order")}
          </p>
        </>
      ),
    },
    {
      key: "route",
      header: t("transfers_route"),
      minWidth: "min-w-[170px]",
      render: (transfer) => (
        <span className="flex items-center gap-2">
          {transfer.fromBranchName}
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          {transfer.toBranchName}
        </span>
      ),
    },
    {
      key: "date",
      header: t("date"),
      responsive: "sm",
      render: (transfer) => <span className="text-muted-foreground">{formatDateTime(transfer.dispatchedAt)}</span>,
    },
    {
      key: "products",
      header: t("order_products"),
      align: "right",
      render: (transfer) => transfer.lineCount,
    },
    {
      key: "total",
      header: t("value"),
      align: "right",
      render: (transfer) => formatMoney(transfer.totalValue),
    },
    {
      key: "status",
      header: t("status"),
      render: (transfer) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={TRANSFER_STATUS_TONE[transfer.status]}>{t(`transfer_status_${transfer.status}`)}</Badge>
          {transfer.pendingDifferences > 0 ? (
            <Badge tone="warning">{t("transfer_pending_differences", { count: transfer.pendingDifferences })}</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (transfer) => (
        <Button type="button" size="sm" variant="outline" onClick={() => onOpen(transfer)}>
          <Eye className="mr-2 size-4" />
          {t("po_detail")}
        </Button>
      ),
    },
  ]
}
