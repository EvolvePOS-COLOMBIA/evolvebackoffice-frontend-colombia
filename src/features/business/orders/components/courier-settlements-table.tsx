import { Bike } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { CourierSettlementRow } from "../types/closing"

/**
 * Valores por domiciliario del periodo: lo que cada uno debe devolver a caja
 * (efectivo conciliado), lo cobrado por otros medios y lo pendiente de
 * conciliar. El costo de envío es informativo.
 */
export function CourierSettlementsTable({ rows }: { rows: CourierSettlementRow[] }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("settlement_empty")}</p>
  }

  const sum = (pick: (r: CourierSettlementRow) => number) => rows.reduce((acc, r) => acc + pick(r), 0)

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("settlement_courier")}</TableHead>
            <TableHead className="text-center">{t("total_orders")}</TableHead>
            <TableHead className="hidden text-right md:table-cell">{t("shipping_cost")}</TableHead>
            <TableHead className="text-right">{t("settlement_cash")}</TableHead>
            <TableHead className="hidden text-right lg:table-cell">{t("settlement_change")}</TableHead>
            <TableHead className="text-right">{t("settlement_other")}</TableHead>
            <TableHead className="text-right">{t("settlement_unreconciled")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.courierId ?? "unassigned"}>
              <TableCell>
                <p className="flex items-center gap-1.5 font-medium">
                  <Bike className={`size-3.5 ${r.courierId ? "text-primary" : "text-muted-foreground"}`} />
                  {r.courierId ? r.courierName : t("courier_unassigned")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.deliveredCount}/{r.ordersCount} {t("settlement_delivered")} · {formatCurrency(r.ordersTotal)}
                </p>
              </TableCell>
              <TableCell className="text-center tabular-nums">{r.ordersCount}</TableCell>
              <TableCell className="hidden text-right font-mono text-muted-foreground tabular-nums md:table-cell">
                {formatCurrency(r.shippingTotal)}
              </TableCell>
              <TableCell className="text-right font-mono font-semibold text-primary tabular-nums">
                {formatCurrency(r.cashToReturn)}
              </TableCell>
              <TableCell className="hidden text-right font-mono text-muted-foreground tabular-nums lg:table-cell">
                {formatCurrency(r.changeGiven)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatCurrency(r.otherMethodsTotal)}</TableCell>
              <TableCell
                className={`text-right font-mono tabular-nums ${r.unreconciledTotal > 0 ? "text-amber-500" : "text-muted-foreground"}`}
              >
                {formatCurrency(r.unreconciledTotal)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 bg-muted/40 hover:bg-muted/40">
            <TableCell className="font-semibold">{t("total")}</TableCell>
            <TableCell className="text-center tabular-nums">{sum((r) => r.ordersCount)}</TableCell>
            <TableCell className="hidden text-right font-mono tabular-nums md:table-cell">
              {formatCurrency(sum((r) => r.shippingTotal))}
            </TableCell>
            <TableCell className="text-right font-mono font-semibold tabular-nums">
              {formatCurrency(sum((r) => r.cashToReturn))}
            </TableCell>
            <TableCell className="hidden text-right font-mono tabular-nums lg:table-cell">
              {formatCurrency(sum((r) => r.changeGiven))}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatCurrency(sum((r) => r.otherMethodsTotal))}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatCurrency(sum((r) => r.unreconciledTotal))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
