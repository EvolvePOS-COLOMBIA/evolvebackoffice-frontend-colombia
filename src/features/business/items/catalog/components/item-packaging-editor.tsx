import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import {
  useCreateItemPackaging,
  useDeleteItemPackaging,
  useItemPackagings,
} from "@/features/business/inventory/hooks/use-inventory"
import { formatQuantity, unitSymbol } from "@/features/business/inventory/utils/units"
import type { ItemResponseDto } from "../types"

type ItemPackagingEditorProps = {
  item: ItemResponseDto
}

/**
 * Presentaciones del producto (pestaña "Presentaciones"): permiten pedir, recibir
 * y contar en la unidad que entiende la persona ("2 bultos") mientras el sistema
 * guarda la unidad base ("50.000 g").
 */
export function ItemPackagingEditor({ item }: ItemPackagingEditorProps) {
  const { t } = useTranslation("business-items-catalog")
  const packagingsQuery = useItemPackagings(item.id)
  const createMutation = useCreateItemPackaging(item.id)
  const deleteMutation = useDeleteItemPackaging(item.id)

  const [name, setName] = useState("")
  const [factor, setFactor] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  const symbol = unitSymbol(item.baseUnit)
  // Ejemplos acordes a la unidad: bultos para gramos, garrafas para ml, cajas para unidades.
  const example = item.baseUnit === 1 ? "gram" : item.baseUnit === 2 ? "ml" : "unit"
  const factorNumber = Number(factor)
  const canAdd = name.trim().length > 0 && factorNumber > 0 && !createMutation.isPending

  const handleAdd = () => {
    if (!canAdd) return
    createMutation.mutate(
      { name: name.trim(), factor: factorNumber, isDefaultPurchase: isDefault },
      {
        onSuccess: () => {
          setName("")
          setFactor("")
          setIsDefault(false)
          notify.success(t("packaging_created"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("packaging_error"))),
      }
    )
  }

  const handleDelete = (packagingId: string) => {
    deleteMutation.mutate(packagingId, {
      onSuccess: () => notify.success(t("packaging_deleted")),
      onError: (error) => notify.error(getApiErrorMessage(error, t("packaging_error"))),
    })
  }

  const packagings = packagingsQuery.data ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(`packagings_desc_${example}`)}</p>

      <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_180px_auto_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="packaging-nombre">{t("packaging_name")}</Label>
          <Input
            id="packaging-nombre"
            placeholder={t(`packaging_name_placeholder_${example}`)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packaging-factor">{t("packaging_factor", { unit: symbol })}</Label>
          <Input
            id="packaging-factor"
            type="number"
            min={0}
            inputMode="decimal"
            placeholder={t(`packaging_factor_placeholder_${example}`)}
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
          />
          {factorNumber > 0 ? (
            <p className="text-xs text-muted-foreground">= {formatQuantity(factorNumber, item.baseUnit)}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch id="packaging-default" checked={isDefault} onCheckedChange={setIsDefault} />
          <Label htmlFor="packaging-default">{t("packaging_default")}</Label>
        </div>
        <Button id="btn-agregar-presentacion" type="button" onClick={handleAdd} disabled={!canAdd}>
          <Plus className="mr-2 size-4" />
          {t("packaging_add")}
        </Button>
      </div>

      {packagingsQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : packagings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("packagings_empty")}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("packaging_name")}</TableHead>
                <TableHead>{t("packaging_contains")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packagings.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{p.name}</span>
                      {p.isDefaultPurchase ? <Badge tone="primary">{t("packaging_default_badge")}</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatQuantity(p.factor, item.baseUnit)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleteMutation.isPending}
                      aria-label={t("packaging_delete")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
