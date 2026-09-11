import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Building2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Minus,
  Plus,
  Key,
  Hash,
  Shield,
  AlertTriangle,
  SquarePen,
} from "lucide-react"

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
import {
  useUpdateTenant,
  useSerialCodes,
  useDecommissionSerial,
  useResetAdminCredentials,
} from "@/features/platform/tenants/hooks/use-tenants"
import { TenantFormDialog } from "@/features/platform/tenants/components/tenant-form-dialog"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"
import type { TenantModule, TenantFormValues } from "../types"
import type { UpdateTenantModuleDto } from "../types/api"

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { t } = useTranslation("platform-tenants")
  const token = session?.accessToken

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [decommissionReason, setDecommissionReason] = useState<Record<string, string>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  const {
    data: serialCodes = [],
    isLoading: serialLoading,
  } = useSerialCodes(id)

  const updateModuleMutation = useUpdateTenantModule(token, tenantIdForModules)
  const decommissionMutation = useDecommissionSerial()
  const resetAdminMutation = useResetAdminCredentials()
  const updateTenantMutation = useUpdateTenant()

  const handleToggleEnabled = (moduleItem: TenantModule) => {
    const newEnabled = !moduleItem.isEnabled
    const body: UpdateTenantModuleDto = {
      isEnabled: newEnabled,
      ...(newEnabled && moduleItem.quantity < 1 ? { quantity: 1 } : {}),
    }
    updateModuleMutation.mutate(
      { modulePublicId: moduleItem.id, body },
      {
        onSuccess: () => notify.success(t("module_updated")),
        onError: (error) =>
          notify.error(error instanceof Error ? error.message : t("module_update_error")),
      }
    )
  }

  const handleQuantityChange = (moduleId: string, value: number, isEnabled: boolean) => {
    const minAllowed = isEnabled ? 1 : 0
    const clamped = Math.max(minAllowed, value)
    setQuantities((prev) => ({ ...prev, [moduleId]: clamped }))
  }

  const handleQuantityIncrement = (moduleId: string, current: number) => {
    handleQuantityChange(moduleId, (quantities[moduleId] ?? current) + 1, true)
  }

  const handleQuantityDecrement = (moduleId: string, current: number, isEnabled: boolean) => {
    const minAllowed = isEnabled ? 1 : 0
    handleQuantityChange(moduleId, Math.max(minAllowed, (quantities[moduleId] ?? current) - 1), isEnabled)
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

  const handleDecommission = (serialId: string) => {
    if (!id) return
    const reason = decommissionReason[serialId] || undefined
    decommissionMutation.mutate(
      { tenantId: id, serialId, reason },
      {
        onSuccess: () => {
          notify.success(t("decommission_success"))
          setDecommissionReason((prev) => {
            const next = { ...prev }
            delete next[serialId]
            return next
          })
        },
        onError: (error) =>
          notify.error(error instanceof Error ? error.message : t("decommission_error")),
      }
    )
  }

  const handleResetAdmin = () => {
    if (!id) return
    if (!window.confirm(t("reset_admin_confirm"))) return
    resetAdminMutation.mutate(id, {
      onSuccess: (data) => {
        notify.success(`${t("reset_admin_success")} ${data.temporaryPassword}`)
      },
      onError: (error) =>
        notify.error(error instanceof Error ? error.message : t("reset_admin_error")),
    })
  }

  const handleUpdateTenant = (values: TenantFormValues) => {
    if (!id || !token) return
    updateTenantMutation.mutate(
      { id, values, token },
      {
        onSuccess: () => {
          notify.success(t("tenant_updated"))
          setEditDialogOpen(false)
        },
        onError: (error) =>
          notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      }
    )
  }

  const isAnyMutating =
    updateModuleMutation.isPending ||
    decommissionMutation.isPending ||
    resetAdminMutation.isPending ||
    updateTenantMutation.isPending

  const summaryTiles = useMemo(() => {
    const enabled = modules.filter((m) => m.isEnabled).length
    const activeSerials = serialCodes.filter((s) => s.status === "Active").length
    return {
      total: modules.length,
      enabled,
      serialTotal: serialCodes.length,
      serialActive: activeSerials,
    }
  }, [modules, serialCodes])

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
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          {t("back_to_tenants")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(true)}
            disabled={isAnyMutating}
          >
            <SquarePen className="size-4" />
            {t("edit")}
          </Button>
          <Button
            variant="outline"
            onClick={handleResetAdmin}
            disabled={isAnyMutating}
          >
            <Key className="size-4" />
            {t("reset_admin")}
          </Button>
        </div>
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
            <SummaryTile
              label={t("serial_codes")}
              value={serialLoading ? 0 : summaryTiles.serialTotal}
              loading={serialLoading}
            />
            <SummaryTile
              label={t("max_registers_info", {
                current: tenant?.currentRegisterCount ?? 0,
                max: tenant?.maxRegisters ?? 0,
              })}
              value={tenant?.currentRegisterCount ?? 0}
              loading={tenantLoading}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoTile icon={Building2} label={t("name")} value={tenant?.name ?? ""} />
              <InfoTile icon={Eye} label={t("tenant_id")} value={tenant?.tenantId ?? ""} />
              <InfoTile icon={Mail} label={t("contact_email")} value={tenant?.contactEmail ?? ""} />
              <InfoTile icon={Phone} label={t("phone")} value={tenant?.phone ?? ""} />
              <InfoTile icon={MapPin} label={t("address")} value={tenant?.address ?? ""} />
              <InfoTile icon={Hash} label={t("subdomain")} value={tenant?.subdomain ?? ""} />
              <InfoTile icon={Shield} label={t("max_branches")} value={String(tenant?.maxBranches ?? 0)} />
              <InfoTile icon={Shield} label={t("max_users")} value={String(tenant?.maxUsers ?? 0)} />
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
                                  handleQuantityDecrement(moduleItem.id, moduleItem.quantity, moduleItem.isEnabled)
                                }
                                disabled={isAnyMutating}
                              >
                                <Minus className="size-4" />
                              </Button>
                              <Input
                                type="number"
                                className="w-24 text-center"
                                min={moduleItem.isEnabled ? 1 : 0}
                                value={displayQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(moduleItem.id, Number(e.target.value), moduleItem.isEnabled)
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
                                handleQuantityDecrement(moduleItem.id, moduleItem.quantity, moduleItem.isEnabled)
                              }
                              disabled={isAnyMutating}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <Input
                              type="number"
                              className="w-24 text-center"
                              min={moduleItem.isEnabled ? 1 : 0}
                              value={displayQuantity}
                              onChange={(e) =>
                                handleQuantityChange(moduleItem.id, Number(e.target.value), moduleItem.isEnabled)
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

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{t("serial_codes")}</CardTitle>
          <CardDescription>{t("serial_codes_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {serialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : serialCodes.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Key className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {t("no_serial_codes")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("no_serial_codes_desc")}</p>
            </Card>
          ) : (
            <>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("serial_code")}</TableHead>
                      <TableHead>{t("serial_status")}</TableHead>
                      <TableHead>{t("serial_machine")}</TableHead>
                      <TableHead>{t("serial_device")}</TableHead>
                      <TableHead>{t("serial_activated")}</TableHead>
                      <TableHead>{t("serial_last_seen")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serialCodes.map((serial) => (
                      <TableRow key={serial.id}>
                        <TableCell>
                          <span className="font-mono text-sm">{serial.serialCode}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              serial.status === "Active"
                                ? "success"
                                : serial.status === "Inactive"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {serial.status === "Active"
                              ? t("serial_status_active")
                              : serial.status === "Inactive"
                              ? t("serial_status_inactive")
                              : t("serial_status_decommissioned")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {serial.machineIdentifier || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {serial.deviceName || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {serial.activatedAt ? formatDateTime(serial.activatedAt) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {serial.lastSeenAt ? formatDateTime(serial.lastSeenAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {serial.status === "Active" && (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="text"
                                className="w-32 text-xs"
                                placeholder={t("decommission_reason")}
                                value={decommissionReason[serial.id] ?? ""}
                                onChange={(e) =>
                                  setDecommissionReason((prev) => ({
                                    ...prev,
                                    [serial.id]: e.target.value,
                                  }))
                                }
                                disabled={isAnyMutating}
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isAnyMutating}
                                onClick={() => handleDecommission(serial.id)}
                              >
                                <AlertTriangle className="size-4" />
                                {t("decommission_serial")}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 xl:hidden">
                {serialCodes.map((serial) => (
                  <Card
                    key={serial.id}
                    className="rounded-[24px] border-border/70 bg-background/45 shadow-none"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{serial.serialCode}</span>
                        <Badge
                          tone={
                            serial.status === "Active"
                              ? "success"
                              : serial.status === "Inactive"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {serial.status === "Active"
                            ? t("serial_status_active")
                            : serial.status === "Inactive"
                            ? t("serial_status_inactive")
                            : t("serial_status_decommissioned")}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">{t("serial_machine")}:</span>{" "}
                          {serial.machineIdentifier || "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("serial_device")}:</span>{" "}
                          {serial.deviceName || "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("serial_activated")}:</span>{" "}
                          {serial.activatedAt ? formatDateTime(serial.activatedAt) : "—"}
                        </div>
                        <div>
                          <span className="font-medium">{t("serial_last_seen")}:</span>{" "}
                          {serial.lastSeenAt ? formatDateTime(serial.lastSeenAt) : "—"}
                        </div>
                      </div>
                      {serial.status === "Active" && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Input
                            type="text"
                            className="flex-1 text-xs"
                            placeholder={t("decommission_reason")}
                            value={decommissionReason[serial.id] ?? ""}
                            onChange={(e) =>
                              setDecommissionReason((prev) => ({
                                ...prev,
                                [serial.id]: e.target.value,
                              }))
                            }
                            disabled={isAnyMutating}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isAnyMutating}
                            onClick={() => handleDecommission(serial.id)}
                          >
                            <AlertTriangle className="size-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <TenantFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tenantToEdit={tenant}
        onSubmit={handleUpdateTenant}
        isSubmitting={updateTenantMutation.isPending}
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  loading = false,
}: {
  label: string
  value: number | string
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
