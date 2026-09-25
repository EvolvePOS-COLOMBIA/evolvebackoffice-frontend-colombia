import { useEffect, useMemo, useState } from "react"
import { Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
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
import { useUpdateBranchItemConfig } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"

type BranchItemTaxDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  item: BranchItemResponseDto | null
}

/**
 * Impuestos de un ítem EN UNA SUCURSAL.
 * Interruptor "Usar configuración global" vs configuración propia de la sucursal
 * (PUT .../config; al personalizar el backend copia la configuración global).
 * En modo global la lista es de solo lectura; en modo propio se puede editar.
 */
export function BranchItemTaxDialog({ open, onOpenChange, branchId, item }: BranchItemTaxDialogProps) {
  const { t } = useTranslation("business-items-catalog")
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const configMutation = useUpdateBranchItemConfig(branchId)
  const assignedQuery = useItemTaxRates(item?.itemPublicId, open ? branchId : undefined)
  const ratesQuery = useTaxRates(1, 500)
  const assignMutation = useAssignItemTaxRates()
  const removeMutation = useRemoveItemTaxRate()

  const useGlobal = item?.useGlobalTaxes ?? true
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

  const isSaving = assignMutation.isPending || removeMutation.isPending || configMutation.isPending

  const toggleRate = (taxRateId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taxRateId)) next.delete(taxRateId)
      else next.add(taxRateId)
      return next
    })
  }

  const handleToggleConfig = (useGlobalValue: boolean) => {
    if (!item) return
    configMutation.mutate({ id: item.id, payload: { useGlobalTaxes: useGlobalValue } })
  }

  const handleSave = async () => {
    if (!item) return
    const adds = activeRates.filter((r) => checkedIds.has(r.id) && !assignedIds.has(r.id)).map((r) => r.id)
    const removes = activeRates.filter((r) => assignedIds.has(r.id) && !checkedIds.has(r.id)).map((r) => r.id)
    if (adds.length === 0 && removes.length === 0) return

    try {
      if (adds.length > 0) {
        await assignMutation.mutateAsync({ itemId: item.itemPublicId, taxRateIds: adds, branchId })
      }
      if (removes.length > 0) {
        await Promise.all(
          removes.map((taxRateId) => removeMutation.mutateAsync({ itemId: item.itemPublicId, taxRateId, branchId }))
        )
      }
      notify.success(t("taxes_saved"))
    } catch {
      // El error ya se notifica desde los hooks
    }
  }

  const isLoading = assignedQuery.isLoading || ratesQuery.isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-160">
        <DialogHeader>
          <DialogTitle>{t("tax_dialog_title")}</DialogTitle>
          <DialogDescription>{item?.itemName ?? ""}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="tax-config-switch">{t("config_global")}</Label>
            <p className="text-xs text-muted-foreground">
              {useGlobal ? t("config_global_hint") : t("config_custom_hint")}
            </p>
          </div>
          <Switch
            id="tax-config-switch"
            checked={useGlobal}
            disabled={configMutation.isPending}
            onCheckedChange={handleToggleConfig}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : activeRates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
            <p className="text-sm">{t("no_active_rates")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!useGlobal && <p className="text-xs text-muted-foreground">{t("taxes_assign_hint")}</p>}
            <div className="flex items-center justify-between">
              <Badge tone={useGlobal ? "neutral" : "primary"} className="w-fit">
                {t("assigned_taxes")}
              </Badge>
              {!useGlobal && (
                <Badge tone="neutral" className="w-fit">
                  {checkedIds.size} {t("selected")}
                </Badge>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {!useGlobal && <TableHead className="w-12">{t("assign_column")}</TableHead>}
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("tax_type")}</TableHead>
                  <TableHead className="text-right">{t("rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRates.map((r) => (
                  <TableRow key={r.id}>
                    {!useGlobal && (
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
                    )}
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge tone="neutral">{r.taxTypeName}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{rateToPercent(r.rate)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {useGlobal && (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                {t("readonly_global")}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          {!useGlobal && activeRates.length > 0 && (
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
              <Save className="size-4" />
              {isSaving ? t("saving") : t("save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
