import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Lock, Monitor, Puzzle, Store } from "lucide-react"

import { EntityListLayout, StatTile } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { BackLink } from "@/components/ui/back-link"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { BranchConfigNav } from "@/features/business/branches/components/config/branch-config-nav"
import {
  CONFIG_SECTIONS,
  parseConfigSection,
  sectionsForLicense,
  type ConfigSectionId,
} from "@/features/business/branches/components/config/config-sections"
import { DeliverySection } from "@/features/business/branches/components/config/delivery-section"
import { InfoSection } from "@/features/business/branches/components/config/info-section"
import { ModulesSection } from "@/features/business/branches/components/config/modules-section"
import { ScheduleSection } from "@/features/business/branches/components/config/schedule-section"
import { SectionShell } from "@/features/business/branches/components/config/settings-primitives"
import { TerminalsSection } from "@/features/business/branches/components/config/terminals-section"
import { IntegrationPanel } from "@/features/business/branches/components/integration-panel"
import { useBranchIntegrations } from "@/features/business/branches/hooks/use-branch-integrations"
import { useBranchModules, useTenantModules } from "@/features/business/branches/hooks/use-branch-modules"
import { useBranchRegisters, useBranchTerminalSettings } from "@/features/business/branches/hooks/use-branch-terminals"
import { getBranchById } from "@/features/business/branches/services/branches.service"
import { useTranslation } from "@/i18n/use-i18n"

type IntegrationCode = "WOOCOMMERCE" | "CLUVI"
const INTEGRATION_BY_SECTION: Partial<Record<ConfigSectionId, IntegrationCode>> = {
  woocommerce: "WOOCOMMERCE",
  cluvi: "CLUVI",
}
const INTEGRATION_CODES: IntegrationCode[] = ["WOOCOMMERCE", "CLUVI"]

/**
 * Advanced settings of a branch. The section lives in the URL (`?tab=`), so every section can be
 * linked. Sections are declared in `config-sections.ts`; this page only wires data to them.
 * Sections already opened stay mounted (hidden), so an edit in progress survives a change of section.
 */
export function BranchConfigPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("business-branches")
  const [searchParams, setSearchParams] = useSearchParams()
  const [dirty, setDirty] = useState<Partial<Record<ConfigSectionId, boolean>>>({})

  const {
    data: branch,
    isLoading: branchLoading,
    isError: branchError,
  } = useQuery({
    queryKey: ["branches", "detail", branchId],
    queryFn: () => getBranchById(branchId!),
    enabled: Boolean(branchId),
  })
  const { data: tenantModules = [], isLoading: tenantModulesLoading } = useTenantModules()
  const { data: branchModules = [] } = useBranchModules(branchId)
  const { data: registers = [] } = useBranchRegisters(branchId)
  const { data: terminalSettings } = useBranchTerminalSettings(branchId)
  const { data: integrations = [] } = useBranchIntegrations(branchId)

  // While the license is loading the delivery section is kept, so a deep link does not flash "info".
  const hasDeliveryLicense =
    tenantModulesLoading || tenantModules.some((module) => module.moduleCode === "DOMICILIOS" && module.isEnabled)
  const hasDeliveryModule = branchModules.some((module) => module.moduleCode === "DOMICILIOS" && module.isEnabled)

  const sections = useMemo(() => sectionsForLicense(hasDeliveryLicense), [hasDeliveryLicense])
  const requested = parseConfigSection(searchParams.get("tab"))
  const active = sections.some((section) => section.id === requested) ? requested : "info"

  // Sections opened at least once stay mounted; the others mount when first visited.
  const [visited, setVisited] = useState<ConfigSectionId[]>([active])
  if (!visited.includes(active)) setVisited([...visited, active])

  const reportDirty = useCallback((id: ConfigSectionId, isDirty: boolean) => {
    setDirty((previous) => (Boolean(previous[id]) === isDirty ? previous : { ...previous, [id]: isDirty }))
  }, [])

  const selectSection = (id: ConfigSectionId) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (id === "info") next.delete("tab")
        else next.set("tab", id)
        return next
      },
      { replace: true }
    )
  }

  const integrationActive = (code: IntegrationCode) =>
    integrations.some((integration) => integration.platformCode?.toUpperCase() === code && integration.isActive)
  const activeIntegrations = INTEGRATION_CODES.filter(integrationActive).length

  const connectionDot = (code: IntegrationCode) => (
    <span
      aria-hidden
      className={`size-2 rounded-full ${integrationActive(code) ? "animate-pulse bg-emerald-400" : "bg-muted-foreground/40"}`}
    />
  )
  const unsavedDot = (id: ConfigSectionId) =>
    dirty[id] ? (
      <span aria-label={t("cfg_unsaved")} title={t("cfg_unsaved")} className="size-2 rounded-full bg-amber-400" />
    ) : null
  const withDirty = (id: ConfigSectionId, node: ReactNode) => (
    <span className="flex items-center gap-1.5">
      {unsavedDot(id)}
      {node}
    </span>
  )

  const indicators: Partial<Record<ConfigSectionId, ReactNode>> = {
    info: unsavedDot("info"),
    schedule: unsavedDot("schedule"),
    modules: <span className="tabular-nums">{branchModules.length}</span>,
    delivery: hasDeliveryModule
      ? unsavedDot("delivery")
      : withDirty("delivery", <Lock className="size-3.5" aria-label={t("cfg_requires_module")} />),
    woocommerce: connectionDot("WOOCOMMERCE"),
    cluvi: connectionDot("CLUVI"),
  }

  if (branchError || (!branchLoading && !branch)) {
    return (
      <ErrorState
        eyebrow={t("eyebrow")}
        title={t("config_branch_not_found")}
        description={t("config_branch_not_found_desc")}
        action={<Button onClick={() => navigate("/business/settings/branches")}>{t("config_back_to_branches")}</Button>}
      />
    )
  }

  const renderSection = (id: ConfigSectionId) => {
    if (!branch || !branchId) return null
    switch (id) {
      case "info":
        return <InfoSection branch={branch} onDirtyChange={reportDirty} />
      case "schedule":
        return <ScheduleSection branchId={branchId} onDirtyChange={reportDirty} />
      case "modules":
        return <ModulesSection branchId={branchId} />
      case "delivery":
        return (
          <DeliverySection
            branchId={branchId}
            branch={branch}
            hasDeliveryModule={hasDeliveryModule}
            onGoToSection={selectSection}
            onDirtyChange={reportDirty}
          />
        )
      case "terminals":
        return <TerminalsSection branchId={branchId} />
      default: {
        const platform = INTEGRATION_BY_SECTION[id]
        const definition = CONFIG_SECTIONS.find((section) => section.id === id)
        if (!platform || !definition) return null
        return (
          <SectionShell
            icon={definition.icon}
            title={t(`section_${id}`)}
            description={t(`section_${id}_desc`)}
            status={
              integrationActive(platform) ? (
                <Badge live tone="success">
                  {t("integration_active")}
                </Badge>
              ) : (
                <Badge tone="warning">{t("integration_not_configured")}</Badge>
              )
            }
          >
            <IntegrationPanel key={platform} branchId={branchId} platform={platform} />
          </SectionShell>
        )
      }
    }
  }

  const heroDescription = branch
    ? [t("cfg_hero_label"), branch.identification, branch.address].filter(Boolean).join(" · ")
    : ""

  const hero = (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="relative min-w-0 space-y-3 xl:flex-1">
        <div>
          <BackLink to="/business/settings/branches">{t("cfg_back_to_branches")}</BackLink>
        </div>
        <div className="space-y-1">
          {branch ? (
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              {branch.name}
              {branch.isActive ? (
                <Badge live tone="success">
                  {t("status_active")}
                </Badge>
              ) : (
                <Badge tone="warning">{t("status_inactive")}</Badge>
              )}
              {branch.isSupplier ? <Badge tone="primary">{t("supplier_badge")}</Badge> : null}
            </h1>
          ) : (
            <Skeleton className="h-9 w-64" />
          )}
          <p className="text-sm text-muted-foreground tabular-nums">{heroDescription}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2.5 xl:justify-end">
        <StatTile icon={Puzzle} tone="primary" label={t("cfg_stat_modules")} value={branchModules.length} />
        <StatTile
          icon={Monitor}
          tone="info"
          label={t("cfg_stat_terminals")}
          value={`${registers.length}/${terminalSettings?.maxTerminals ?? "–"}`}
        />
        <StatTile
          icon={Store}
          tone="success"
          label={t("cfg_stat_integrations")}
          value={`${activeIntegrations}/${INTEGRATION_CODES.length}`}
        />
      </div>
    </div>
  )

  return (
    <EntityListLayout hero={hero} className="animate-in duration-500 fade-in slide-in-from-bottom-2">
      <div className="@container flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 @3xl:grid-cols-[232px_minmax(0,1fr)] @3xl:grid-rows-1">
          <BranchConfigNav sections={sections} active={active} onSelect={selectSection} indicators={indicators} />
          {branchLoading || !branch ? (
            <Skeleton className="min-h-48 rounded-2xl" />
          ) : (
            visited.map((id) => (
              <div key={id} hidden={id !== active} className={id === active ? "contents" : undefined}>
                {renderSection(id)}
              </div>
            ))
          )}
        </div>
      </div>
    </EntityListLayout>
  )
}
