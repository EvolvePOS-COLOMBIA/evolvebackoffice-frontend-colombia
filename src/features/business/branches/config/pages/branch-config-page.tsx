import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Building2, CheckCircle2, Globe, MonitorCog, Package, ShoppingCart, Tag, Trash2, Warehouse } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getBranchById } from "@/features/business/branches/services/branches.service"
import {
  useAssignModuleToBranch,
  useBranchModules,
  useRemoveModuleFromBranch,
  useTenantModules,
} from "@/features/business/branches/hooks/use-branch-modules"
import { useBranchRegisters } from "@/features/business/branches/hooks/use-branch-terminals"
import { useBranchIntegrationByPlatform } from "@/features/business/branches/hooks/use-branch-integrations"

import { IntegrationForm } from "@/features/business/branches/config/components/integration-form"

import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

const MODULE_ICONS: Record<string, typeof Package> = {
  DOMICILIOS: ShoppingCart,
  FIDELIZACION: Tag,
  MESAS: Warehouse,
  PRODUCCION: Package,
  WOOCOMMERCE: Globe,
}

function moduleIcon(code: string | null) {
  return MODULE_ICONS[code ?? ""] ?? Package
}

export function BranchConfigPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("business-branches-config")

  const [activeTab, setActiveTab] = useState("info")

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

  const { data: branchModules = [], isLoading: branchModulesLoading } = useBranchModules(branchId)

  const { data: registers = [], isLoading: registersLoading } = useBranchRegisters(branchId)

  const { data: wooIntegration, isLoading: wooLoading } = useBranchIntegrationByPlatform(branchId, "WOOCOMMERCE")
  const { data: cluviIntegration, isLoading: cluviLoading } = useBranchIntegrationByPlatform(branchId, "CLUVI")

  const assignMutation = useAssignModuleToBranch()
  const removeMutation = useRemoveModuleFromBranch()

  const assignedTenantModuleIds = new Set(branchModules.map((bm) => bm.tenantModuleId))

  const handleAssign = (tenantModulePublicId: string) => {
    if (!branchId) return
    assignMutation.mutate(
      { branchId, tenantModulePublicId },
      {
        onSuccess: () => notify.success(t("modules_assign_success")),
        onError: (err) => notify.error(err instanceof Error ? err.message : t("error_loading")),
      }
    )
  }

  const handleRemove = (modulePublicId: string) => {
    if (!branchId) return
    removeMutation.mutate(
      { branchId, modulePublicId },
      {
        onSuccess: () => notify.success(t("modules_remove_success")),
        onError: (err) => notify.error(err instanceof Error ? err.message : t("error_loading")),
      }
    )
  }

  if (branchError || (!branchLoading && !branch)) {
    return (
      <ErrorState
        eyebrow="Branch"
        title={t("branch_not_found")}
        description={t("branch_not_found_desc")}
        action={<Button onClick={() => navigate("/business/settings/branches")}>{t("back_to_branches")}</Button>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden border-border/80 bg-card/70 shadow-none">
        <div className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full border border-primary/10 bg-primary/[0.035]" />
        <CardContent className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          {branchLoading ? (
            <>
              <div className="space-y-3">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 w-24 rounded-2xl" />
                <Skeleton className="h-20 w-24 rounded-2xl" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
                  <Building2 className="size-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground">
                      {branch?.name}
                    </h1>
                    <Badge tone={branch?.isActive ? "success" : "warning"}>
                      {branch?.isActive ? t("info_active") : t("info_inactive")}
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t("page_desc")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <HeroMetric
                  icon={Package}
                  label={t("tab_modules")}
                  value={branchModules.length}
                  loading={branchModulesLoading}
                />
                <HeroMetric
                  icon={MonitorCog}
                  label={t("tab_serials")}
                  value={registers.length}
                  loading={registersLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl border border-border/70 bg-card/70 p-1">
          <TabsTrigger value="info">{t("tab_info")}</TabsTrigger>
          <TabsTrigger value="modules">{t("tab_modules")}</TabsTrigger>
          <TabsTrigger value="serials">{t("tab_serials")}</TabsTrigger>
          <TabsTrigger value="woocommerce">{t("tab_woocommerce")}</TabsTrigger>
          <TabsTrigger value="cluvi">{t("tab_cluvi")}</TabsTrigger>
        </TabsList>

        {/* ───── TAB: INFO ───── */}
        <TabsContent value="info" className="mt-0 outline-none">
          <Card className="border-border/80 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle>{t("info_title")}</CardTitle>
              <CardDescription>{t("info_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {branchLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label={t("info_name")} value={branch?.name} />
                  <InfoRow label={t("info_identification")} value={branch?.identification} />
                  <InfoRow label={t("info_address")} value={branch?.address} />
                  <InfoRow label={t("info_phone")} value={branch?.phone} />
                  <InfoRow label={t("info_email")} value={branch?.email} />
                  <InfoRow label={t("info_admin")} value={branch?.adminUserName} />
                  <InfoRow
                    label={t("info_status")}
                    value={
                      <Badge tone={branch?.isActive ? "success" : "warning"}>
                        {branch?.isActive ? t("info_active") : t("info_inactive")}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label={t("info_created")}
                    value={branch?.createdAt ? formatDateTime(branch.createdAt) : "—"}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── TAB: MODULES ───── */}
        <TabsContent value="modules" className="mt-0 outline-none">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 bg-card/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle>{t("modules_assigned")}</CardTitle>
                <CardDescription>{t("modules_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {branchModulesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : branchModules.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("modules_empty")}
                    <br />
                    <span className="text-xs">{t("modules_empty_hint")}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {branchModules.map((bm) => {
                      const Icon = moduleIcon(bm.moduleCode)
                      return (
                        <div
                          key={bm.id}
                          className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-4 py-3 transition-colors hover:border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="size-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{bm.moduleName ?? bm.moduleCode}</p>
                              <p className="text-xs text-muted-foreground">{bm.moduleCode}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(bm.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="size-4" />
                            {t("modules_remove")}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/70 shadow-none">
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle>{t("modules_available")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {tenantModulesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : tenantModules.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">{t("modules_none_available")}</div>
                ) : (
                  <div className="space-y-2">
                    {tenantModules
                      .filter((tm) => tm.isEnabled)
                      .map((tm) => {
                        const Icon = moduleIcon(tm.moduleCode)
                        const isAssigned = assignedTenantModuleIds.has(Number(tm.id))
                        return (
                          <div
                            key={tm.id}
                            className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-4 py-3 transition-colors hover:border-primary/20"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{tm.moduleName ?? tm.moduleCode}</p>
                                <p className="text-xs text-muted-foreground">{tm.moduleCode}</p>
                              </div>
                            </div>
                            {isAssigned ? (
                              <Badge tone="success">
                                <CheckCircle2 className="mr-1 size-3" />
                                {t("modules_assign")}
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssign(tm.id)}
                                disabled={assignMutation.isPending}
                              >
                                {t("modules_assign")}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── TAB: SERIALS ───── */}
        <TabsContent value="serials" className="mt-0 outline-none">
          <Card className="border-border/80 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle>{t("serials_title")}</CardTitle>
              <CardDescription>{t("serials_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {registersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : registers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("serials_empty")}
                  <br />
                  <span className="text-xs">{t("serials_empty_hint")}</span>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("modules_code")}</TableHead>
                          <TableHead>{t("serials_status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registers.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm">{r.serialCode ?? r.code}</TableCell>
                            <TableCell>
                              <Badge tone={r.status === "Active" ? "success" : "warning"}>
                                {r.status === "Active"
                                  ? t("serials_status_active")
                                  : r.status === "Maintenance"
                                    ? t("serials_status_activated")
                                    : r.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {registers.map((r) => (
                      <Card key={r.id} className="rounded-2xl border-border/70 bg-background/45 shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{r.serialCode ?? r.code}</span>
                            <Badge tone={r.status === "Active" ? "success" : "warning"}>
                              {r.status === "Active"
                                ? t("serials_status_active")
                                : r.status === "Maintenance"
                                  ? t("serials_status_activated")
                                  : r.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── TAB: WOOCOMMERCE ───── */}
        <TabsContent value="woocommerce" className="mt-0 outline-none">
          {wooLoading ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-64 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : (
            <IntegrationForm branchId={branchId!} platformCode="WOOCOMMERCE" integration={wooIntegration} />
          )}
        </TabsContent>

        {/* ───── TAB: CLUVI ───── */}
        <TabsContent value="cluvi" className="mt-0 outline-none">
          {cluviLoading ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-64 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : (
            <IntegrationForm branchId={branchId!} platformCode="CLUVI" integration={cluviIntegration} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ───── Helper components ───── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3.5 transition-colors hover:border-primary/20">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  )
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  loading = false,
}: {
  icon: typeof Package
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <div className="min-w-24 rounded-2xl border border-border/70 bg-background/45 px-3 py-3 sm:min-w-28 sm:px-4">
      <Icon className="size-3.5 text-primary" />
      <p className="mt-2 truncate text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:text-[10px]">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-5 w-6" />
      ) : (
        <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      )}
    </div>
  )
}
