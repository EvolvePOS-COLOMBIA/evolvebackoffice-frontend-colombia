import { useState } from "react"
import { Percent } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { type LinePrice, type PriceBase, type PriceMode, resolvePrice } from "../utils/pricing"
import { formatMoney } from "../utils/units"

type LinePriceInputProps = {
  /** Precio de venta y costo de quien vende, por la unidad mostrada. */
  base: PriceBase
  unitLabel: string
  value: LinePrice
  onChange: (value: LinePrice) => void
  /** Texto cuando la opción elegida no tiene valor (sin precio de venta ni costo). */
  noBaseLabel: string
}

/** Precio de una línea: precio de venta, + %, costo o especial; muestra el resultado. */
export function LinePriceInput({ base, unitLabel, value, onChange, noBaseLabel }: LinePriceInputProps) {
  const { t } = useTranslation("business-inventory")
  const resolved = resolvePrice(base, value)
  const percentOverCost = base.sale == null

  return (
    <div className="min-w-56 space-y-1">
      <div className="flex gap-2">
        <Select value={value.mode} onValueChange={(mode) => onChange({ ...value, mode: mode as PriceMode })}>
          <SelectTrigger className="w-40" aria-label={t("price_mode")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale" disabled={base.sale == null}>
              {t("price_mode_sale")}
            </SelectItem>
            <SelectItem value="percent" disabled={base.sale == null && base.cost == null}>
              {percentOverCost ? t("price_mode_cost_percent") : t("price_mode_percent")}
            </SelectItem>
            <SelectItem value="cost" disabled={base.cost == null}>
              {t("price_mode_cost")}
            </SelectItem>
            <SelectItem value="special">{t("price_mode_special")}</SelectItem>
          </SelectContent>
        </Select>
        {value.mode === "percent" ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="any"
              className="w-20"
              aria-label={t("price_percent")}
              value={value.percent}
              onChange={(e) => onChange({ ...value, percent: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ) : null}
        {value.mode === "special" ? (
          <Input
            type="number"
            min={0}
            step="any"
            className="w-28"
            aria-label={t("price_special")}
            value={value.special}
            onChange={(e) => onChange({ ...value, special: e.target.value })}
          />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {resolved !== null
          ? `= ${formatMoney(resolved)} / ${unitLabel}`
          : value.mode === "special" || value.mode === "percent"
            ? t("price_missing")
            : noBaseLabel}
      </p>
      {value.mode === "percent" && percentOverCost ? (
        <p className="text-xs text-muted-foreground">{t("price_base_is_cost")}</p>
      ) : null}
    </div>
  )
}

/** Atajo: subir el mismo % a todas las líneas (sobre su precio de venta o, si no tiene, su costo). */
export function BulkPercent({ onApply }: { onApply: (percent: string) => void }) {
  const { t } = useTranslation("business-inventory")
  const [percent, setPercent] = useState("")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("price_bulk_label")}</span>
      <Input
        type="number"
        step="any"
        className="w-24"
        aria-label={t("price_percent")}
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={percent.trim() === ""}
        onClick={() => onApply(percent)}
      >
        <Percent className="mr-2 size-4" />
        {t("price_bulk_apply")}
      </Button>
    </div>
  )
}
