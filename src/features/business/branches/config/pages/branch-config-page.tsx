import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Package,
  ShoppingCart,
  Tag,
  Trash2,
  Warehouse,
} from "lucide-react"

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

  const {
    data: tenantModules = [],
    isLoading: tenantModulesLoading,
  } = useTenantModules()

  const {
    data: branchModules = [],
    isLoading: branchModulesLoading,
  } = useBranchModules(branchId)

  const {
    data: registers = [],
    isLoading: registersLoading,
  } = useBranchRegisters(branchId)

  const { data: wooIntegration, isLoading: wooLoading } = useBranchIntegrationByPlatform(branchId, "WOOCOMMERCE")
  const { data: cluviIntegration, isLoading: cluviLoading } = useBranchIntegrationByPlatform(branchId, "CLUVI")

  const assignMutation = useAssignModuleToBranch()
  const removeMutation = useRemoveModuleFromBranch()

  const assignedTenantModuleIds = new Set(
    branchModules.map((bm) => bm.tenantModuleId)
  )

  const handleAssign = (tenantModulePublicId: string) => {
    if (!branchId) return
    assignMutation.mutate(
      { branchId, tenantModulePublicId },
      {
        onSuccess: () => notify.success(t("modules_assign_success")),
        onError: (err) =>
          notify.error(err instanceof Error ? err.message : t("error_loading")),
      }
    )
  }

  const handleRemove = (modulePublicId: string) => {
    if (!branchId) return
    removeMutation.mutate(
      { branchId, modulePublicId },
      {
        onSuccess: () => notify.success(t("modules_remove_success")),
        onError: (err) =>
          notify.error(err instanceof Error ? err.message : t("error_loading")),
      }
    )
  }

  if (branchError || (!branchLoading && !branch)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business/settings")}>
          <ArrowLeft className="size-4" />
          {t("back_to_branches")}
        </Button>
        <ErrorState
          eyebrow="Branch"
          title={t("branch_not_found")}
          description={t("branch_not_found_desc")}
          action={
            <Button onClick={() => navigate("/business/settings/registers")}>
              {t("back_to_branches")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        {t("back_to_branches")}
      </Button>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/business/settings/registers")}
        >
          {t("breadcrumb_branches")}
        </Button>
        <span>/</span>
        <span>{branchLoading ? <Skeleton className="h-4 w-32 inline-block" /> : branch?.name}</span>
        <span>/</span>
        <span className="text-foreground font-medium">{t("breadcrumb_config")}</span>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-6 lg:p-8">
          {branchLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-balance text-foreground">
                  {branch?.name}
                </h1>
                <Badge tone={branch?.isActive ? "success" : "warning"}>
                  {branch?.isActive ? t("info_active") : t("info_inactive")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("page_desc")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">{t("tab_info")}</TabsTrigger>
          <TabsTrigger value="modules">{t("tab_modules")}</TabsTrigger>
          <TabsTrigger value="serials">{t("tab_serials")}</TabsTrigger>
          <TabsTrigger value="woocommerce">{t("tab_woocommerce")}</TabsTrigger>
          <TabsTrigger value="cluvi">{t("tab_cluvi")}</TabsTrigger>
        </TabsList>

        {/* ───── TAB: INFO ───── */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>{t("info_title")}</CardTitle>
              <CardDescription>{t("info_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {branchLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label={t("info_name")} value={branch?.name} />
                  <InfoRow label={t("info_identification")} value={branch?.identification} />
                  <InfoRow label={t("info_address")} value={branch?.address} />
                  <InfoRow label={t("info_phone")} value={branch?.phone} />
                  <InfoRow label={t("info_email")} value={branch?.email} />
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
        <TabsContent value="modules">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("modules_assigned")}</CardTitle>
                <CardDescription>{t("modules_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
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
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-4 py-3"
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

            <Card>
              <CardHeader>
                <CardTitle>{t("modules_available")}</CardTitle>
              </CardHeader>
              <CardContent>
                {tenantModulesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : tenantModules.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("modules_none_available")}
                  </div>
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
                            className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-4 py-3"
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
        <TabsContent value="serials">
          <Card>
            <CardHeader>
              <CardTitle>{t("serials_title")}</CardTitle>
              <CardDescription>{t("serials_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
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
                            <TableCell className="font-mono text-sm">
                              {r.serialCode ?? r.code}
                            </TableCell>
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
        <TabsContent value="woocommerce">
          {wooLoading ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-64 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : (
            <IntegrationForm
              branchId={branchId!}
              platformCode="WOOCOMMERCE"
              integration={wooIntegration}
            />
          )}
        </TabsContent>

        {/* ───── TAB: CLUVI ───── */}
        <TabsContent value="cluvi">
          {cluviLoading ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-64 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : (
            <IntegrationForm
              branchId={branchId!}
              platformCode="CLUVI"
              integration={cluviIntegration}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ───── Helper components ───── */

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value ?? "—"}
      </p>
    </div>
  )
}
