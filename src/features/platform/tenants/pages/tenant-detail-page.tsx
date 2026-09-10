import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Eye, Mail, Phone, MapPin, Calendar, Save, Minus, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ErrorState } from "@/components/ui/error-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTenant } from "@/features/platform/tenants/services/tenant.service"
import {
  useTenantModules,
  useUpdateTenantModule,
} from "@/features/platform/tenants/hooks/use-tenant-modules"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"
import type { TenantModule } from "../types"
import type { UpdateTenantModuleDto } from "../types/api"

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { t } = useTranslation("platform-tenants")
  const token = session?.accessToken

  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const {
    data: tenant,
    isLoading: tenantLoading,
    isError: tenantError,
  } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => getTenant(id!),
    enabled: Boolean(id),
  })

  const tenantIdForModules = tenant?.tenantId

  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError: modulesError,
  } = useTenantModules(token, tenantIdForModules)

  const updateModuleMutation = useUpdateTenantModule(token, tenantIdForModules)

  const handleToggleEnabled = (moduleItem: TenantModule) => {
    const body: UpdateTenantModuleDto = { isEnabled: !moduleItem.isEnabled }
    updateModuleMutation.mutate(
      { modulePublicId: moduleItem.id, body },
      {
        onSuccess: () => notify.success(t("module_updated")),
        onError: (error) =>
          notify.error(error instanceof Error ? error.message : t("module_update_error")),
      }
    )
  }

  const handleQuantityChange = (moduleId: string, value: number) => {
    const clamped = Math.max(0, value)
    setQuantities((prev) => ({ ...prev, [moduleId]: clamped }))
  }

  const handleQuantityIncrement = (moduleId: string, current: number) => {
    handleQuantityChange(moduleId, (quantities[moduleId] ?? current) + 1)
  }

  const handleQuantityDecrement = (moduleId: string, current: number) => {
    handleQuantityChange(moduleId, Math.max(0, (quantities[moduleId] ?? current) - 1))
  }

  const handleSaveQuantity = (moduleItem: TenantModule) => {
    const newQuantity = quantities[moduleItem.id] ?? moduleItem.quantity
    const body: UpdateTenantModuleDto = { quantity: newQuantity }
    updateModuleMutation.mutate(
      { modulePublicId: moduleItem.id, body },
      {
        onSuccess: () => {
          notify.success(t("module_updated"))
          setQuantities((prev) => {
            const next = { ...prev }
            delete next[moduleItem.id]
            return next
          })
        },
        onError: (error) =>
          notify.error(error instanceof Error ? error.message : t("module_update_error")),
      }
    )
  }

  const isAnyMutating = updateModuleMutation.isPending
  const summaryTiles = useMemo(() => {
    const enabled = modules.filter((m) => m.isEnabled).length
    return { total: modules.length, enabled }
  }, [modules])

  if (tenantError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          {t("back_to_tenants")}
        </Button>
        <ErrorState
          eyebrow="Tenant"
          title={t("tenant_not_found")}
          description={t("tenant_not_found_desc")}
          action={
            <Button onClick={() => navigate("/platform/tenants")}>
              <Building2 className="size-4" />
              {t("back_to_tenants")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          {t("back_to_tenants")}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("tenant_detail")}</Badge>
            {tenantLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold text-balance text-foreground">
                    {tenant?.name}
                  </h1>
                  <Badge tone={tenant?.isActive ? "success" : "warning"}>
                    {tenant?.isActive ? t("status_active") : t("status_inactive")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tenant_id")}: {tenant?.tenantId}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile
              label={t("total_modules")}
              value={modulesLoading ? 0 : summaryTiles.total}
              loading={modulesLoading}
            />
            <SummaryTile
              label={t("enabled_modules")}
              value={modulesLoading ? 0 : summaryTiles.enabled}
              loading={modulesLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{t("summary")}</CardTitle>
          <CardDescription>{t("contact_information")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {tenantLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile icon={Building2} label={t("name")} value={tenant?.name ?? ""} />
              <InfoTile icon={Eye} label={t("tenant_id")} value={tenant?.tenantId ?? ""} />
              <InfoTile icon={Mail} label={t("contact_email")} value={tenant?.contactEmail ?? ""} />
              <InfoTile icon={Phone} label={t("phone")} value={tenant?.phone ?? ""} />
              <InfoTile icon={MapPin} label={t("address")} value={tenant?.address ?? ""} />
              <InfoTile
                icon={Calendar}
                label={t("created")}
                value={tenant ? formatDateTime(tenant.createdAt) : ""}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{t("assigned_modules")}</CardTitle>
          <CardDescription>{t("assigned_modules_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {modulesError ? (
            <ErrorState
              variant="inline"
              eyebrow="Modules"
              title={t("modules_load_error")}
              description={t("modules_load_error_desc")}
            />
          ) : modulesLoading ? (
            <ModulesSkeleton />
          ) : modules.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Building2 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {t("no_modules_found")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("no_modules_found_desc")}</p>
            </Card>
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("module_name")}</TableHead>
                      <TableHead>{t("module_enabled")}</TableHead>
                      <TableHead>{t("module_quantity")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((moduleItem) => {
                      const displayQuantity =
                        quantities[moduleItem.id] ?? moduleItem.quantity
                      const isDirty = quantities[moduleItem.id] !== undefined
                      return (
                        <TableRow key={moduleItem.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{moduleItem.moduleName}</span>
                                <Badge tone="neutral" className="text-[10px]">
                                  {moduleItem.moduleCode}
                                </Badge>
                              </div>
                              {moduleItem.moduleDescription ? (
                                <p className="text-sm text-muted-foreground">
                                  {moduleItem.moduleDescription}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={moduleItem.isEnabled}
                              onCheckedChange={() => handleToggleEnabled(moduleItem)}
                              disabled={isAnyMutating}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleQuantityDecrement(moduleItem.id, moduleItem.quantity)
                                }
                                disabled={isAnyMutating}
                              >
                                <Minus className="size-4" />
                              </Button>
                              <Input
                                type="number"
                                className="w-24 text-center"
                                min={0}
                                value={displayQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(moduleItem.id, Number(e.target.value))
                                }
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleQuantityIncrement(moduleItem.id, moduleItem.quantity)
                                }
                                disabled={isAnyMutating}
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              disabled={!isDirty || isAnyMutating}
                              onClick={() => handleSaveQuantity(moduleItem)}
                            >
                              <Save className="size-4" />
                              {t("save")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {modules.map((moduleItem) => {
                  const displayQuantity =
                    quantities[moduleItem.id] ?? moduleItem.quantity
                  const isDirty = quantities[moduleItem.id] !== undefined
                  return (
                    <Card
                      key={moduleItem.id}
                      className="rounded-[24px] border-border/70 bg-background/45 shadow-none"
                    >
                      <CardContent className="space-y-4 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">
                                {moduleItem.moduleName}
                              </h3>
                              <Badge tone="neutral" className="text-[10px]">
                                {moduleItem.moduleCode}
                              </Badge>
                            </div>
                            {moduleItem.moduleDescription ? (
                              <p className="text-sm text-muted-foreground">
                                {moduleItem.moduleDescription}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {t("module_enabled")}
                            </span>
                            <Switch
                              checked={moduleItem.isEnabled}
                              onCheckedChange={() => handleToggleEnabled(moduleItem)}
                              disabled={isAnyMutating}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {t("module_quantity")}:
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleQuantityDecrement(moduleItem.id, moduleItem.quantity)
                              }
                              disabled={isAnyMutating}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <Input
                              type="number"
                              className="w-24 text-center"
                              min={0}
                              value={displayQuantity}
                              onChange={(e) =>
                                handleQuantityChange(moduleItem.id, Number(e.target.value))
                              }
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleQuantityIncrement(moduleItem.id, moduleItem.quantity)
                              }
                              disabled={isAnyMutating}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            disabled={!isDirty || isAnyMutating}
                            onClick={() => handleSaveQuantity(moduleItem)}
                          >
                            <Save className="size-4" />
                            {t("save")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  loading = false,
}: {
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-16" />
        ) : (
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 ml-6 text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  )
}

function ModulesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="hidden xl:block">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  )
}
