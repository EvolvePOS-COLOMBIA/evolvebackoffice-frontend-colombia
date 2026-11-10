import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useItemPackagings } from "../hooks/use-inventory"
import { BASE_UNIT_KEY, formatQuantity, toBaseQuantity, unitSymbol, type QuantityUnitValue } from "../utils/units"

type QuantityUnitInputProps = {
  id: string
  itemId: string
  baseUnit: number
  value: QuantityUnitValue
  onChange: (value: QuantityUnitValue) => void
}

/**
 * Cantidad en la unidad que entiende la persona: "2" + "Bulto 25 kg" o "500" + "g".
 * Muestra el equivalente en unidad base para evitar errores de digitación.
 */
export function QuantityUnitInput({ id, itemId, baseUnit, value, onChange }: QuantityUnitInputProps) {
  const { data: packagings = [] } = useItemPackagings(itemId)
  const baseQuantity = toBaseQuantity(value, packagings)

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={value.amount}
          onChange={(e) => onChange({ ...value, amount: e.target.value })}
          className="flex-1"
        />
        <Select value={value.unitKey} onValueChange={(unitKey) => onChange({ ...value, unitKey })}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BASE_UNIT_KEY}>{unitSymbol(baseUnit)}</SelectItem>
            {packagings.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value.unitKey !== BASE_UNIT_KEY && baseQuantity !== null ? (
        <p className="text-xs text-muted-foreground">= {formatQuantity(baseQuantity, baseUnit)}</p>
      ) : null}
    </div>
  )
}
