import { BarChart3, Grid2x2, Layers, Monitor, Package, Store, Truck, Users, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"

import { TOGGLEABLE_MODULES } from "../constants"
import type { ModuleKey, ModuleSelection } from "../types"
import { StepCard, StepFooter } from "./step-frame"

type StepModulesProps = {
  branchName: string
  modules: ModuleSelection
  isSubmitting: boolean
  onToggle: (key: ModuleKey) => void
  onBack: () => void
  onSubmit: () => void
}

const BASE_MODULES: { key: string; icon: LucideIcon }[] = [
  { key: "catalogo", icon: Package },
  { key: "cajas", icon: Monitor },
  { key: "usuarios", icon: Users },
]

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  inventario: Layers,
  clientes: Users,
  proveedores: Truck,
  reportes: BarChart3,
}

export function StepModules({ branchName, modules, isSubmitting, onToggle, onBack, onSubmit }: StepModulesProps) {
  const { t } = useTranslation("business-onboarding")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <StepCard icon={Grid2x2} title={t("modules_title")} description={t("modules_description")}>
        <div className="flex items-center gap-3.5 rounded-2xl border border-primary/25 bg-primary/7 px-4 py-3">
          <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9.6px] bg-primary/12 text-primary">
            <Store className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{branchName || t("your_branch")}</p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">{t("modules_preset_hint", { type: "" })}</p>
          </div>
        </div>

        <div className="mt-4.5 grid gap-3.5 sm:grid-cols-2">
          {BASE_MODULES.map(({ key, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-muted/45 p-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(`module_${key}`)}</p>
                <p className="text-xs leading-[17px] text-muted-foreground">{t(`module_${key}_desc`)}</p>
              </div>
              <Badge tone="neutral" className="shrink-0 text-[9px] tracking-[0.14em]">
                {t("module_base")}
              </Badge>
            </div>
          ))}

          {TOGGLEABLE_MODULES.map((key) => {
            const Icon = MODULE_ICONS[key]
            const isOn = modules[key]

            return (
              <div
                key={key}
                role="group"
                aria-label={t(`module_${key}`)}
                onClick={() => onToggle(key)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault()
                    onToggle(key)
                  }
                }}
                tabIndex={0}
                className={cn(
                  "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 text-left transition-colors",
                  isOn ? "border-primary/30 bg-primary/6" : "border-border/70 bg-card/55"
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isOn ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t(`module_${key}`)}</p>
                  <p className="text-xs leading-[17px] text-muted-foreground">{t(`module_${key}_desc`)}</p>
                </div>
                <Switch checked={isOn} tabIndex={-1} className="pointer-events-none shrink-0" />
              </div>
            )
          })}
        </div>
      </StepCard>

      <StepFooter onBack={onBack} backLabel={t("back")} submitLabel={t("finish_setup")} isSubmitting={isSubmitting} />
    </form>
  )
}
