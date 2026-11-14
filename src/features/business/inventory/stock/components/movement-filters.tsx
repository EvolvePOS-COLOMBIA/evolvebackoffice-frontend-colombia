import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { useMovementAuthors } from "../../hooks/use-inventory"
import { MOVEMENT_DOCUMENT_TYPES, MOVEMENT_REASONS } from "../../types"
import { ALL, type MovementFilterForm } from "./movement-filter-form"

type MovementFiltersContentProps = {
  branchId: string
  value: MovementFilterForm
  onChange: (value: MovementFilterForm) => void
  /**
   * Grilla densa para el popover ancho: 3 columnas y los rangos como celda
   * individual en vez de ancho completo. Sin esto (el panel lateral) usa
   * 2 columnas y los rangos ocupan la fila entera.
   */
  dense?: boolean
}

/** Filtros avanzados del historial: viven dentro del contenedor que los abre (sheet o popover). */
export function MovementFiltersContent({ branchId, value, onChange, dense = false }: MovementFiltersContentProps) {
  const { t } = useTranslation("business-inventory")
  const authors = useMovementAuthors(branchId)

  const set = (key: keyof MovementFilterForm) => (next: string) => onChange({ ...value, [key]: next })

  const select = (key: keyof MovementFilterForm, label: string, allLabel: string, options: [string, string][]) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value[key]} onValueChange={set(key)}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const field = (key: keyof MovementFilterForm, label: string, type = "text", placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`movimientos-${key}`}>{label}</Label>
      <Input
        id={`movimientos-${key}`}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        value={value[key]}
        onChange={(e) => set(key)(e.target.value)}
      />
    </div>
  )

  const range = (min: keyof MovementFilterForm, max: keyof MovementFilterForm, label: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`movimientos-${min}`}
          type="number"
          inputMode="decimal"
          min={0}
          aria-label={`${label} ${t("filter_from")}`}
          placeholder={t("filter_min")}
          className="min-w-0 flex-1"
          value={value[min]}
          onChange={(e) => set(min)(e.target.value)}
        />
        <span className="shrink-0 text-muted-foreground">–</span>
        <Input
          id={`movimientos-${max}`}
          type="number"
          inputMode="decimal"
          min={0}
          aria-label={`${label} ${t("filter_to")}`}
          placeholder={t("filter_max")}
          className="min-w-0 flex-1"
          value={value[max]}
          onChange={(e) => set(max)(e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className={dense ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2"}>
        {field("from", t("filter_from"), "date")}
        {field("to", t("filter_to"), "date")}
        {select("direction", t("filter_direction"), t("filter_all_directions"), [
          ["in", t("filter_direction_in")],
          ["out", t("filter_direction_out")],
        ])}
        {select(
          "documentType",
          t("document"),
          t("filter_all_documents"),
          MOVEMENT_DOCUMENT_TYPES.map((d) => [d, t(`document_type_${d}`)])
        )}
        {field("documentNumber", t("filter_document_number"), "text", t("filter_document_number_placeholder"))}
        {select(
          "reason",
          t("filter_reason"),
          t("filter_all_reasons"),
          MOVEMENT_REASONS.map((r) => [r, t(`reason_${r}`)])
        )}
        {select(
          "createdBy",
          t("user"),
          t("filter_all_users"),
          (authors.data ?? []).map((name) => [name, name])
        )}
        {field("notes", t("filter_notes"), "text", t("filter_notes_placeholder"))}
        {select("reversed", t("filter_reversed"), t("filter_all_states"), [
          ["no", t("filter_reversed_no")],
          ["yes", t("filter_reversed_yes")],
        ])}
        {/*
          En denso los rangos son celda individual: 12 celdas en 3 columnas =
          4 filas en vez de 8. Cada celda lleva dos inputs de ancho libre
          (`min-w-0` + `flex-1`) para que no empujen la fila.
        */}
        <div className={dense ? "min-w-0" : "sm:col-span-2"}>{range("minQuantity", "maxQuantity", t("quantity"))}</div>
        <div className={dense ? "min-w-0" : "sm:col-span-2"}>
          {range("minUnitCost", "maxUnitCost", t("filter_unit_cost"))}
        </div>
        <div className={dense ? "min-w-0" : "sm:col-span-2"}>
          {range("minTotalCost", "maxTotalCost", t("filter_total_cost"))}
        </div>
      </div>
    </div>
  )
}
