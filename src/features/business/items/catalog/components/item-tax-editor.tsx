import { useEffect, useMemo, useState } from "react"
import { Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import {
  useAssignItemTaxRates,
  useItemTaxRates,
  useRemoveItemTaxRate,
  useTaxRates,
} from "../../taxes/hooks/use-tax-rates"
import { rateToPercent } from "../../taxes/types"
import type { ItemResponseDto } from "../types"

type ItemTaxEditorProps = {
  item: ItemResponseDto
}

/**
 * Editor de impuestos GLOBALES de un producto (pestaña "Impuestos" del diálogo de editar).
 * El POST del backend solo agrega, así que las bajas se ejecutan una a una con DELETE.
 */
export function ItemTaxEditor({ item }: ItemTaxEditorProps) {
  const { t } = useTranslation("business-items-catalog")
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const assignedQuery = useItemTaxRates(item.id)
  const ratesQuery = useTaxRates(1, 500)
  const assignMutation = useAssignItemTaxRates()
  const removeMutation = useRemoveItemTaxRate()

  const activeRates = useMemo(() => (ratesQuery.data?.data ?? []).filter((r) => r.isActive), [ratesQuery.data?.data])
  const assignedIds = useMemo(() => new Set((assignedQuery.data ?? []).map((x) => x.taxRateId)), [assignedQuery.data])

  useEffect(() => {
    setCheckedIds(new Set(assignedIds))
  }, [assignedIds])

  const isDirty = useMemo(() => {
    if (checkedIds.size !== assignedIds.size) return true
    for (const id of checkedIds) {
      if (!assignedIds.has(id)) return true
    }
    return false
  }, [assignedIds, checkedIds])

  const isSaving = assignMutation.isPending || removeMutation.isPending

  const toggleRate = (taxRateId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taxRateId)) next.delete(taxRateId)
      else next.add(taxRateId)
      return next
    })
  }

  const handleSave = async () => {
    const adds = activeRates.filter((r) => checkedIds.has(r.id) && !assignedIds.has(r.id)).map((r) => r.id)
    const removes = activeRates.filter((r) => assignedIds.has(r.id) && !checkedIds.has(r.id)).map((r) => r.id)
    if (adds.length === 0 && removes.length === 0) return

    try {
      if (adds.length > 0) await assignMutation.mutateAsync({ itemId: item.id, taxRateIds: adds })
      if (removes.length > 0) {
        await Promise.all(removes.map((taxRateId) => removeMutation.mutateAsync({ itemId: item.id, taxRateId })))
      }
      notify.success(t("taxes_saved"))
    } catch {
      // El error ya se notifica desde los hooks
    }
  }

  if (assignedQuery.isLoading || ratesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (activeRates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
        <p className="text-sm">{t("no_active_rates")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("taxes_assign_hint")}</p>

      <div className="flex items-center justify-between">
        <Badge tone="primary" className="w-fit">
          {t("assigned_taxes")}
        </Badge>
        <Badge tone="neutral" className="w-fit">
          {checkedIds.size} {t("selected")}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("assign_column")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("tax_type")}</TableHead>
            <TableHead className="text-right">{t("rate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeRates.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <input
                  type="checkbox"
                  className="size-4"
                  aria-label={r.name}
                  checked={checkedIds.has(r.id)}
                  disabled={isSaving}
                  onChange={() => toggleRate(r.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge tone="neutral">{r.taxTypeName}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">{rateToPercent(r.rate)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          <Save className="size-4" />
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
