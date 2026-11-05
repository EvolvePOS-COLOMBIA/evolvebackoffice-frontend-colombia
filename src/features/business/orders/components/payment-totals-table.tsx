import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { PaymentTotalsRow } from "../types/closing"

/** Cuadre por medio de pago: lo declarado por el cliente vs lo conciliado. */
export function PaymentTotalsTable({ rows }: { rows: PaymentTotalsRow[] }) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  // El catálogo trae todos los medios activos; se ocultan los que están en cero.
  const visible = rows.filter((r) => r.expectedAmount !== 0 || r.currentAmount !== 0)

  if (visible.length === 0) return <p className="text-sm text-muted-foreground">{t("totals_empty")}</p>

  const totalExpected = visible.reduce((acc, r) => acc + r.expectedAmount, 0)
  const totalCurrent = visible.reduce((acc, r) => acc + r.currentAmount, 0)

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60">
      <Table className="min-w-[420px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("totals_method")}</TableHead>
            <TableHead className="text-right">{t("totals_expected")}</TableHead>
            <TableHead className="text-right">{t("totals_reconciled")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.paymentMethodCode}>
              <TableCell className="font-medium">{r.paymentMethodName}</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                {formatCurrency(r.expectedAmount)} <span className="text-[11px]">({r.expectedCount})</span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(r.currentAmount)} <span className="text-[11px]">({r.currentCount})</span>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>{t("totals_total")}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(totalExpected)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatCurrency(totalCurrent)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
