import { Globe, Package, Puzzle, ShoppingCart, Tag, Warehouse, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  useAssignModuleToBranch,
  useBranchModules,
  useModuleUsage,
  useRemoveModuleFromBranch,
  useTenantModules,
} from "@/features/business/branches/hooks/use-branch-modules"
import {
  getAssignableTenantModules,
  getBranchScopedAssignments,
  isTenantModuleAssigned,
} from "@/features/business/branches/utils/branch-modules"
import { licenseState, moduleUsageKey } from "@/features/business/branches/utils/module-usage"
import type { LicenseState, ModuleUsage } from "@/features/business/branches/types/modules"
import { isBranchScopedModule } from "@/utils/module-scope"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { cn } from "@/lib/utils"
import { SectionShell, SettingsGroup } from "./settings-primitives"

const MODULE_ICONS: Record<string, LucideIcon> = {
  DOMICILIOS: ShoppingCart,
  FIDELIZACION: Tag,
  MESAS: Warehouse,
  PRODUCCION: Package,
  WOOCOMMERCE: Globe,
}

const MAX_NAMED_BRANCHES = 2

type TFn = ReturnType<typeof useTranslation>["t"]

/** Línea de uso de licencias bajo la descripción: barra de avance y, si no queda cupo, dónde está en uso. */
function ModuleUsageLine({
  moduleName,
  usage,
  state,
  isGlobal,
  t,
}: {
  moduleName: string
  usage: ModuleUsage
  state: LicenseState
  isGlobal: boolean
  t: TFn
}) {
  if (isGlobal) return <p className="text-xs text-muted-foreground">{t("cfg_modules_global")}</p>
  if (state.unlimited) return <p className="text-xs text-muted-foreground">{t("cfg_modules_unlimited")}</p>

  const total = state.total ?? 0
  const percent = total > 0 ? Math.min(100, Math.round((state.used / total) * 100)) : 0
  const tone = state.exhausted ? "bg-rose-500" : state.free === 1 ? "bg-amber-500" : "bg-primary"
  const names = usage.assignedBranches.map((branch) => branch.branchName).filter(Boolean)
  const shown = names.slice(0, MAX_NAMED_BRANCHES).join(", ")
  const extra = names.length - MAX_NAMED_BRANCHES
  const summary = extra > 0 ? shown + " " + t("cfg_modules_and_more", { count: extra }) : shown

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t("cfg_modules_usage", { used: state.used, total, count: state.free ?? 0 })}
      </p>
      <div
        role="progressbar"
        aria-label={t("cfg_modules_usage_aria", { module: moduleName })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(state.used, total)}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: percent + "%" }} />
      </div>
      {!state.canEnable ? (
        <div className="space-y-0.5 text-xs">
          <p className="font-medium text-rose-600 dark:text-rose-400">{t("cfg_modules_exhausted")}</p>
          {summary ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  tabIndex={0}
                  title={t("cfg_modules_in_use_at", { names: names.join(", ") })}
                  className="w-fit cursor-help text-muted-foreground"
                >
                  {t("cfg_modules_in_use_at", { names: summary })}
                </p>
              </TooltipTrigger>
              <TooltipContent>{t("cfg_modules_in_use_at", { names: names.join(", ") })}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** One card per module of the license; the switch assigns or removes it for this branch. */
export function ModulesSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("business-branches")
  const { data: allTenantModules = [], isLoading: tenantLoading } = useTenantModules()
  const { data: allBranchModules = [], isLoading: branchLoading } = useBranchModules(branchId)
  // Only per-branch modules: business-wide ones already apply everywhere and the backend rejects assigning them.
  const tenantModules = getAssignableTenantModules(allTenantModules)
  const branchModules = getBranchScopedAssignments(allBranchModules)
  const assign = useAssignModuleToBranch()
  const remove = useRemoveModuleFromBranch()
  const { data: usageMap, isLoading: usageLoading, isError: usageError } = useModuleUsage()

  const isLoading = tenantLoading || branchLoading
  const isMutating = assign.isPending || remove.isPending

  const assignedFor = (moduleCode: string | null) =>
    moduleCode ? branchModules.find((branchModule) => branchModule.moduleCode === moduleCode) : undefined
  const assignedCount = tenantModules.filter((module) => isTenantModuleAssigned(module, branchModules)).length

  // Licencias libres sumadas de los módulos con límite; sin datos de uso no se muestra nada.
  const freeLicenses = usageMap
    ? tenantModules.reduce((sum, module) => {
        const state = licenseState(usageMap[moduleUsageKey(module)], isTenantModuleAssigned(module, branchModules))
        return sum + (state.free ?? 0)
      }, 0)
    : null
  const hasLimitedModules = usageMap
    ? tenantModules.some((module) => !licenseState(usageMap[moduleUsageKey(module)], false).unlimited)
    : false

  const toggle = (tenantModuleId: string, moduleCode: string | null, checked: boolean) => {
    if (checked) {
      assign.mutate(
        { branchId, tenantModulePublicId: tenantModuleId },
        {
          onSuccess: () => notify.success(t("modules_assign_success")),
          onError: (error) => notify.error(getApiErrorMessage(error, t("error_loading"))),
        }
      )
      return
    }
    const current = assignedFor(moduleCode)
    if (!current) return
    remove.mutate(
      { branchId, modulePublicId: current.id },
      {
        onSuccess: () => notify.success(t("modules_remove_success")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("error_loading"))),
      }
    )
  }

  return (
    <SectionShell icon={Puzzle} title={t("section_modules")} description={t("section_modules_desc")}>
      <SettingsGroup
        icon={Puzzle}
        title={t("cfg_modules_group")}
        aside={
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("cfg_modules_active", { count: assignedCount })}
            {hasLimitedModules && freeLicenses !== null
              ? " · " + t("cfg_modules_free_summary", { count: freeLicenses })
              : ""}
          </span>
        }
      >
        {usageError ? <p className="px-4 pt-3 text-xs text-muted-foreground">{t("cfg_modules_usage_error")}</p> : null}
        {isLoading ? (
          <div className="grid gap-3 p-4 @xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : tenantModules.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("modules_none_available")}</p>
        ) : (
          <TooltipProvider>
            <div className="grid gap-3 p-4 @xl:grid-cols-2 @4xl:grid-cols-3">
              {tenantModules.map((module) => {
                const Icon = MODULE_ICONS[module.moduleCode ?? ""] ?? Package
                const assigned = isTenantModuleAssigned(module, branchModules)
                const usage = usageMap?.[moduleUsageKey(module)]
                const state = licenseState(usage, assigned)
                const moduleName = module.moduleName ?? module.moduleCode ?? ""
                const isGlobal = !isBranchScopedModule(module.moduleCode, module.isBranchScoped)
                return (
                  <article
                    key={module.id}
                    className={cn(
                      "space-y-2.5 rounded-2xl border border-border/70 bg-background/45 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                      assigned && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                            assigned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <p className="truncate text-sm font-semibold">{module.moduleName ?? module.moduleCode}</p>
                      </div>
                      {module.isEnabled ? (
                        <Switch
                          glow
                          checked={assigned}
                          disabled={isMutating || !state.canEnable}
                          onCheckedChange={(checked) => toggle(module.id, module.moduleCode, checked)}
                          aria-label={module.moduleName ?? module.moduleCode ?? ""}
                        />
                      ) : (
                        <Badge tone="warning">{t("cfg_module_no_license")}</Badge>
                      )}
                    </div>
                    {module.moduleDescription ? (
                      <p className="text-xs leading-5 text-muted-foreground">{module.moduleDescription}</p>
                    ) : null}
                    {usageLoading ? (
                      <Skeleton className="h-3 w-2/3 rounded" />
                    ) : usage ? (
                      <ModuleUsageLine moduleName={moduleName} usage={usage} state={state} isGlobal={isGlobal} t={t} />
                    ) : null}
                  </article>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </SettingsGroup>
    </SectionShell>
  )
}
