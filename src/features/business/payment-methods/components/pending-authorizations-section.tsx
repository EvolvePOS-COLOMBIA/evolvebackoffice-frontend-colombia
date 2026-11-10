import { Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { usePendingAuthorizations } from "../../people/credit/hooks/use-person-credit"

/**
 * F5 — Autorizaciones de crédito pendientes de liquidar: consumos que el POS
 * autorizó en vivo y cuya venta aún no llega en el lote offline. Se actualiza
 * sola (60s) y las expiradas las libera el backend.
 */
export function PendingAuthorizationsSection() {
  const { t } = useTranslation("business-credit")
  const { formatCurrency, formatDateTime } = useLocaleFormat()
  const { data, isLoading } = usePendingAuthorizations(true)

  const items = data ?? []

  return (
    <section className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Clock className="size-3.5" />
            {t("pending_title")}
          </p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{t("pending_desc")}</p>
        </div>
        <Badge tone={items.length > 0 ? "warning" : "neutral"}>{items.length}</Badge>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("pending_empty")}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">{t("pending_person")}</TableHead>
                <TableHead className="text-right">{t("pending_amount")}</TableHead>
                <TableHead className="min-w-[200px] font-mono">{t("pending_code")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("pending_created")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("pending_expires")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.personName}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatCurrency(a.amount)}</TableCell>
                  <TableCell className="font-mono text-xs">{a.authorizationCode}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDateTime(new Date(a.createdAt))}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {a.expiresAt ? formatDateTime(new Date(a.expiresAt)) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
