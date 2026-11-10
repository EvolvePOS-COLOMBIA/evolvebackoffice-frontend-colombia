import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { usePurchaseOrders } from "../../hooks/use-purchasing"
import { formatDateTime, ORDER_STATUS_TONE } from "../../utils/status"
import { formatMoney } from "../../utils/units"

type OrdersTableProps = {
  query: ReturnType<typeof usePurchaseOrders>
  /** Título de la columna de la contraparte ("Le pediste a", "Te pide", "Proveedor"). */
  counterpartLabel: string
  /** supplier = a quién se le pidió · branch = quién pidió. */
  counterpart: "supplier" | "branch"
  emptyLabel: string
  onOpen: (id: string) => void
}

/** Lista de pedidos u órdenes de compra; al tocar una fila se abre el detalle. */
export function OrdersTable({ query, counterpartLabel, counterpart, emptyLabel, onOpen }: OrdersTableProps) {
  const { t } = useTranslation("business-inventory")
  const rows = query.data?.items ?? []

  if (query.isLoading) return <Skeleton className="h-48 w-full" />
  if (rows.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("document")}</TableHead>
            <TableHead>{counterpartLabel}</TableHead>
            <TableHead>{t("date")}</TableHead>
            <TableHead className="text-right">{t("order_products")}</TableHead>
            <TableHead className="text-right">{t("value")}</TableHead>
            <TableHead>{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => onOpen(o.id)}>
              <TableCell className="font-medium text-foreground">{o.number}</TableCell>
              <TableCell>{counterpart === "supplier" ? o.supplierName : o.branchName}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(o.sentAt ?? o.createdAt)}</TableCell>
              <TableCell className="text-right">{o.lineCount}</TableCell>
              <TableCell className="text-right">{formatMoney(o.estimatedTotal)}</TableCell>
              <TableCell>
                <Badge tone={ORDER_STATUS_TONE[o.status]}>{t(`order_status_${o.status}`)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
