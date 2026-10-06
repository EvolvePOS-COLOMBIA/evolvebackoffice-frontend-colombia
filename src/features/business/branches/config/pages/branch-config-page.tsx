import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Clock, Globe, Package, ShoppingCart, Tag, Trash2, Warehouse } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useUpdateBranch } from "@/features/business/branches/hooks/use-branches"
import { useBranchRegisters } from "@/features/business/branches/hooks/use-branch-terminals"
import { useBranchIntegrationByPlatform } from "@/features/business/branches/hooks/use-branch-integrations"

import { IntegrationForm } from "@/features/business/branches/config/components/integration-form"

import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { isTenantOnlyModule } from "@/utils/module-scope"
import { getTimeZoneOptions, TIME_ZONE_AUTO } from "@/utils/timezones"
import { getApiErrorMessage } from "@/utils/api-error"
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

function registerStatusTone(status: string) {
  switch (status) {
    case "Active":
      return "success"
    case "Locked":
      return "danger"
    case "Maintenance":
      return "warning"
    default:
      return "neutral"
  }
}

function registerStatusKey(status: string) {
  switch (status) {
    case "Active":
      return "serials_status_active"
    case "Maintenance":
      return "serials_status_maintenance"
    case "Locked":
      return "serials_status_locked"
    default:
      return "serials_status_inactive"
  }
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

  // El tab Cluvi solo se muestra si el módulo CLUVI está habilitado para el
  // tenant (licencia dada de baja en la consola de plataforma). Si la pestaña
  // activa deja de existir se muestra "info" sin necesidad de un effect.
  const cluviEnabled = !tenantModulesLoading && tenantModules.some((m) => m.moduleCode === "CLUVI" && m.isEnabled)
  const effectiveTab = !cluviEnabled && activeTab === "cluvi" ? "info" : activeTab

  const { data: branchModules = [], isLoading: branchModulesLoading } = useBranchModules(branchId)

  const { data: registers = [], isLoading: registersLoading } = useBranchRegisters(branchId)

  const { data: wooIntegration, isLoading: wooLoading } = useBranchIntegrationByPlatform(branchId, "WOOCOMMERCE")
  const { data: cluviIntegration, isLoading: cluviLoading } = useBranchIntegrationByPlatform(branchId, "CLUVI")

  const assignMutation = useAssignModuleToBranch()
  const removeMutation = useRemoveModuleFromBranch()

  // Zona horaria de la sucursal: draft con patrón "derived state" (sin effect)
  // para no pisar el valor del servidor mientras carga ni violar reglas lint.
  const updateBranchMutation = useUpdateBranch()
  const [tzDraft, setTzDraft] = useState<string | null>(null)
  const selectedTz = tzDraft ?? branch?.timeZoneId ?? ""
  const tzDirty = tzDraft !== null && tzDraft !== (branch?.timeZoneId ?? "")

  const handleSaveTimeZone = () => {
    if (!branch || !branchId) return
    updateBranchMutation.mutate(
      {
        id: branchId,
        payload: {
          name: branch.name,
          identification: branch.identification,
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          adminUserId: branch.adminUserId,
          timeZoneId: selectedTz,
        },
      },
      {
        onSuccess: () => {
          setTzDraft(selectedTz)
          notify.success(t("time_zone_saved"))
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("time_zone_error"))),
      }
    )
  }

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
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/business/settings")}>
          <ArrowLeft className="size-4" />
          {t("back_to_branches")}
        </Button>
        <ErrorState
          eyebrow="Branch"
          title={t("branch_not_found")}
          description={t("branch_not_found_desc")}
          action={<Button onClick={() => navigate("/business/settings/registers")}>{t("back_to_branches")}</Button>}
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
        <span>{branchLoading ? <Skeleton className="inline-block h-4 w-32" /> : branch?.name}</span>
        <span>/</span>
        <span className="font-medium text-foreground">{t("breadcrumb_config")}</span>
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
                <h1 className="text-3xl font-semibold text-balance text-foreground">{branch?.name}</h1>
                <Badge tone={branch?.isActive ? "success" : "warning"}>
                  {branch?.isActive ? t("info_active") : t("info_inactive")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("page_desc")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={effectiveTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">{t("tab_info")}</TabsTrigger>
          <TabsTrigger value="modules">{t("tab_modules")}</TabsTrigger>
          <TabsTrigger value="serials">{t("tab_serials")}</TabsTrigger>
          <TabsTrigger value="woocommerce">{t("tab_woocommerce")}</TabsTrigger>
          {cluviEnabled && <TabsTrigger value="cluvi">{t("tab_cluvi")}</TabsTrigger>}
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

          {/* ───── Zona horaria de la sucursal (día local para reportes/IA) ───── */}
          {!branchLoading && branch ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  {t("time_zone")}
                </CardTitle>
                <CardDescription>{t("time_zone_hint")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full max-w-sm space-y-2">
                  <Select
                    value={selectedTz || TIME_ZONE_AUTO}
                    onValueChange={(value) => setTzDraft(value === TIME_ZONE_AUTO ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("time_zone_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TIME_ZONE_AUTO}>{t("time_zone_auto")}</SelectItem>
                      {getTimeZoneOptions().map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={handleSaveTimeZone}
                  disabled={updateBranchMutation.isPending || !tzDirty}
                >
                  {updateBranchMutation.isPending ? t("time_zone_saving") : t("time_zone_save")}
                </Button>
              </CardContent>
            </Card>
          ) : null}
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
                  <div className="py-8 text-center text-sm text-muted-foreground">{t("modules_none_available")}</div>
                ) : (
                  <div className="space-y-2">
                    {tenantModules
                      // Los módulos de nivel tenant (p. ej. CREDITO) se habilitan
                      // en la plataforma, nunca se asignan a una sucursal.
                      .filter((tm) => tm.isEnabled && !isTenantOnlyModule(tm.moduleCode))
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
                          <TableHead>{t("serials_code")}</TableHead>
                          <TableHead>{t("serials_device")}</TableHead>
                          <TableHead>{t("serials_status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registers.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm">{r.serialCode ?? r.code}</TableCell>
                            <TableCell className="text-muted-foreground">{r.deviceIdentifier || "—"}</TableCell>
                            <TableCell>
                              <Badge tone={registerStatusTone(r.status)}>{t(registerStatusKey(r.status))}</Badge>
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
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm">{r.serialCode ?? r.code}</span>
                            <Badge tone={registerStatusTone(r.status)}>{t(registerStatusKey(r.status))}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t("serials_device")}: {r.deviceIdentifier || "—"}
                          </p>
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
            <IntegrationForm branchId={branchId!} platformCode="WOOCOMMERCE" integration={wooIntegration} />
          )}
        </TabsContent>

        {/* ───── TAB: CLUVI ───── */}
        {cluviEnabled && (
          <TabsContent value="cluvi">
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
        )}
      </Tabs>
    </div>
  )
}

/* ───── Helper components ───── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  )
}
