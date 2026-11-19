import { Globe, Package, Puzzle, ShoppingCart, Tag, Warehouse, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  useAssignModuleToBranch,
  useBranchModules,
  useRemoveModuleFromBranch,
  useTenantModules,
} from "@/features/business/branches/hooks/use-branch-modules"
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

/** One card per module of the license; the switch assigns or removes it for this branch. */
export function ModulesSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("business-branches")
  const { data: tenantModules = [], isLoading: tenantLoading } = useTenantModules()
  const { data: branchModules = [], isLoading: branchLoading } = useBranchModules(branchId)
  const assign = useAssignModuleToBranch()
  const remove = useRemoveModuleFromBranch()

  const isLoading = tenantLoading || branchLoading
  const isMutating = assign.isPending || remove.isPending

  // The tenant module id is a GUID and `tenantModuleId` of a branch module is an internal integer,
  // so there is no id to join them: the module code is the shared key.
  const assignedFor = (moduleCode: string | null) =>
    moduleCode ? branchModules.find((branchModule) => branchModule.moduleCode === moduleCode) : undefined
  const assignedCount = tenantModules.filter((module) => assignedFor(module.moduleCode)).length

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
          </span>
        }
      >
        {isLoading ? (
          <div className="grid gap-3 p-4 @xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : tenantModules.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("modules_none_available")}</p>
        ) : (
          <div className="grid gap-3 p-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            {tenantModules.map((module) => {
              const Icon = MODULE_ICONS[module.moduleCode ?? ""] ?? Package
              const assigned = Boolean(assignedFor(module.moduleCode))
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
                        disabled={isMutating}
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
                </article>
              )
            })}
          </div>
        )}
      </SettingsGroup>
    </SectionShell>
  )
}
