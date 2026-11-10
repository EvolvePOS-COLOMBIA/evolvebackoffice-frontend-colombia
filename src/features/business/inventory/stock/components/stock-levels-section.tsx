import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useUpdateStockLevels } from "../../hooks/use-inventory"
import { formatQuantity, unitSymbol } from "../../utils/units"

type StockLevelsSectionProps = {
  branchItemId: string
  baseUnit: number
  reorderPoint: number
  restockLevel: number
}

/** Mínimo y máximo del producto en una sucursal (alerta "bajo el mínimo" y sugerido de pedidos). */
export function StockLevelsSection({ branchItemId, baseUnit, reorderPoint, restockLevel }: StockLevelsSectionProps) {
  const { t } = useTranslation("business-inventory")
  const updateLevels = useUpdateStockLevels()
  const [min, setMin] = useState(() => (reorderPoint ? String(reorderPoint) : ""))
  const [max, setMax] = useState(() => (restockLevel ? String(restockLevel) : ""))

  const minValue = Number(min || 0)
  const maxValue = Number(max || 0)
  const invalid = minValue < 0 || maxValue < 0 || (maxValue > 0 && maxValue < minValue)
  const changed = minValue !== reorderPoint || maxValue !== restockLevel

  const handleSave = () => {
    if (invalid) return
    updateLevels.mutate(
      { branchItemId, reorderPoint: minValue, restockLevel: maxValue },
      {
        onSuccess: () => notify.success(t("levels_saved")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/70 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t("levels_title")}</p>
        <p className="text-xs text-muted-foreground">{t("levels_desc")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nivel-minimo">{t("min_level", { unit: unitSymbol(baseUnit) })}</Label>
          <Input
            id="nivel-minimo"
            type="number"
            min={0}
            step="any"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          {minValue > 0 ? <p className="text-xs text-muted-foreground">{formatQuantity(minValue, baseUnit)}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivel-maximo">{t("max_level", { unit: unitSymbol(baseUnit) })}</Label>
          <Input
            id="nivel-maximo"
            type="number"
            min={0}
            step="any"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
          {maxValue > 0 ? <p className="text-xs text-muted-foreground">{formatQuantity(maxValue, baseUnit)}</p> : null}
        </div>
      </div>
      {invalid ? <p className="text-xs font-medium text-destructive">{t("levels_invalid")}</p> : null}
      <div className="flex justify-end">
        <Button
          id="btn-guardar-niveles"
          type="button"
          onClick={handleSave}
          disabled={invalid || !changed || updateLevels.isPending}
        >
          {updateLevels.isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
