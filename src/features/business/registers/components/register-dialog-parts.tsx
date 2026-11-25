import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTenantSerialCodes } from "@/features/business/registers/hooks/use-registers"
import { serialStatusKey, serialStatusTone } from "@/features/business/registers/utils/register-status"
import { useTranslation } from "@/i18n/use-i18n"

/** Cabecera de los diálogos: icono en un recuadro, título y descripción. */
export function DialogTitleBlock({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <DialogHeader className="flex-row items-start gap-4 pr-10">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 space-y-1">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </div>
    </DialogHeader>
  )
}

/** Agrupa campos relacionados bajo un encabezado pequeño, para dar jerarquía al formulario. */
export function FormSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{title}</h3>
        {hint ? <span className="ml-auto text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </section>
  )
}

const NO_SERIAL = "__none__"

/**
 * Selector de serial POS: solo muestra los que están libres (más el actual al editar), en vez de
 * pedir que se escriba el código a mano.
 */
export function SerialSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation("business-registers")
  const { data: serials = [], isLoading } = useTenantSerialCodes()

  const options = serials.filter(
    (s) => s.status !== "Decommissioned" && (!s.isAssignedToRegister || s.serialCode === value)
  )

  return (
    <Select
      value={value || NO_SERIAL}
      onValueChange={(next) => onChange(next === NO_SERIAL ? "" : next)}
      disabled={disabled || isLoading}
    >
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("serial_placeholder")} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={NO_SERIAL}>
          <span className="text-muted-foreground">{t("serial_none")}</span>
        </SelectItem>
        {options.map((s) => (
          <SelectItem key={s.id} value={s.serialCode}>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs">{s.serialCode}</span>
              {/* Los libres son la norma: solo se marca el que no lo es (p. ej. el serial actual). */}
              {s.status !== "Unassigned" ? (
                <Badge tone={serialStatusTone(s.status)}>{t(serialStatusKey(s.status))}</Badge>
              ) : null}
            </span>
          </SelectItem>
        ))}
        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{t("serial_pool_empty_hint")}</p>
        ) : null}
      </SelectContent>
    </Select>
  )
}
