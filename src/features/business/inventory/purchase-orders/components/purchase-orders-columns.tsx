import { Ban, Eye } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GoodsReceiptDto, PurchaseOrderSummaryDto } from "../../types/purchasing"
import { formatDateTime, ORDER_STATUS_TONE } from "../../utils/status"
import { formatMoney } from "../../utils/units"

type OrderColumnsActions = {
  /** Title of the counterpart column ("Supplier" for external purchase orders). */
  counterpartLabel: string
  /** supplier = who was asked · branch = who asked. */
  counterpart: "supplier" | "branch"
  onOpen: (order: PurchaseOrderSummaryDto) => void
}

export function buildOrderColumns(
  t: (key: string) => string,
  { counterpartLabel, counterpart, onOpen }: OrderColumnsActions
): ColumnDef<PurchaseOrderSummaryDto>[] {
  return [
    {
      key: "document",
      header: t("document"),
      minWidth: "min-w-[140px]",
      // Plain text cell; the detail opens from the actions button.
      render: (order) => <span className="font-medium text-foreground">{order.number}</span>,
    },
    {
      key: "counterpart",
      header: counterpartLabel,
      minWidth: "min-w-[170px]",
      render: (order) => (counterpart === "supplier" ? order.supplierName : order.branchName),
    },
    {
      key: "date",
      header: t("date"),
      responsive: "sm",
      render: (order) => (
        <span className="text-muted-foreground">{formatDateTime(order.sentAt ?? order.createdAt)}</span>
      ),
    },
    {
      key: "products",
      header: t("order_products"),
      align: "right",
      render: (order) => order.lineCount,
    },
    {
      key: "total",
      header: t("value"),
      align: "right",
      render: (order) => formatMoney(order.estimatedTotal),
    },
    {
      key: "status",
      header: t("status"),
      render: (order) => <Badge tone={ORDER_STATUS_TONE[order.status]}>{t(`order_status_${order.status}`)}</Badge>,
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (order) => (
        <Button type="button" size="sm" variant="outline" onClick={() => onOpen(order)}>
          <Eye className="mr-2 size-4" />
          {t("po_detail")}
        </Button>
      ),
    },
  ]
}

type ReceiptColumnsActions = {
  onVoid: (receipt: GoodsReceiptDto) => void
}

export function buildReceiptColumns(
  t: (key: string) => string,
  { onVoid }: ReceiptColumnsActions
): ColumnDef<GoodsReceiptDto>[] {
  return [
    {
      key: "document",
      header: t("document"),
      minWidth: "min-w-[140px]",
      render: (receipt) => (
        <>
          <p className="font-medium text-foreground">{receipt.number}</p>
          {receipt.purchaseOrderNumber ? (
            <p className="text-xs text-muted-foreground">{receipt.purchaseOrderNumber}</p>
          ) : null}
        </>
      ),
    },
    {
      key: "supplier",
      header: t("receipt_supplier"),
      minWidth: "min-w-[170px]",
      render: (receipt) => receipt.supplierName ?? t("receipt_no_supplier"),
    },
    {
      key: "invoice",
      header: t("receive_invoice"),
      render: (receipt) => <span className="text-muted-foreground">{receipt.invoiceNumber ?? "—"}</span>,
    },
    {
      key: "date",
      header: t("date"),
      responsive: "sm",
      render: (receipt) => <span className="text-muted-foreground">{formatDateTime(receipt.createdAt)}</span>,
    },
    {
      key: "total",
      header: t("value"),
      align: "right",
      render: (receipt) => formatMoney(receipt.total),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (receipt) =>
        receipt.status === "Voided" ? (
          <Badge tone="danger">{t("receipt_voided")}</Badge>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => onVoid(receipt)}>
            <Ban className="mr-2 size-4" />
            {t("void")}
          </Button>
        ),
    },
  ]
}
