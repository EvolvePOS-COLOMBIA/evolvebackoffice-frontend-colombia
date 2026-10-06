import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/i18n/use-i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  User,
  Globe,
  CreditCard,
  Users,
  Package,
  Minus,
  Plus,
  Flag,
  Clock,
} from "lucide-react"
import { getTimeZoneOptions, TIME_ZONE_AUTO } from "@/utils/timezones"

import { notify } from "@/hooks/use-notify"
import { isTenantOnlyModule } from "@/utils/module-scope"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { createTenant } from "@/features/platform/tenants/services/tenant.service"
import { bulkUpdateTenantModules } from "@/features/platform/tenants/services/tenant-modules.service"
import type {
  CreateTenantDto,
  BulkUpdateTenantModuleItemDto,
  CreateTenantResponseDto,
} from "@/features/platform/tenants/types/api"
import { DocumentType } from "@/features/platform/tenants/types/api"
import { tenantCreateSchema } from "@/features/platform/tenants/schemas/tenant-schema"
import { useModulesCatalog } from "@/features/platform/tenants/hooks/use-modules-catalog"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Spinner from "@/components/Spinner"

export function TenantCreatePage() {
  const navigate = useNavigate()
  const { t } = useTranslation("platform-tenants")
  const { session } = useAuth()
  const token = session?.accessToken

  const { data: catalogModules = [], isLoading: catalogLoading } = useModulesCatalog(token)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Credenciales + seriales generados: se muestran UNA sola vez tras crear.
  const [createdResult, setCreatedResult] = useState<CreateTenantResponseDto | null>(null)

  const [modulesState, setModulesState] = useState<Record<string, { isEnabled: boolean; quantity: number }>>({})

  const form = useForm<{
    name: string
    contactEmail: string
    phone: string
    address: string
    countryCode: string
    maxRegisters: number
    adminIdentification: string
    subdomain: string
    identificationNumber: string
    identificationTypeId: number
    maxBranches: number
    maxUsers: number
    timeZoneId: string
  }>({
    resolver: zodResolver(tenantCreateSchema(t)) as never,
    defaultValues: {
      name: "",
      contactEmail: "",
      phone: "",
      address: "",
      countryCode: "",
      maxRegisters: 1,
      adminIdentification: "",
      subdomain: "",
      identificationNumber: "",
      identificationTypeId: 0,
      maxBranches: 0,
      maxUsers: 0,
      timeZoneId: "",
    },
  })

  const handleToggleModule = (moduleId: string, checked: boolean) => {
    setModulesState((prev) => {
      const current = prev[moduleId] ?? { isEnabled: false, quantity: 1 }
      return {
        ...prev,
        [moduleId]: {
          isEnabled: checked,
          quantity: checked && current.quantity < 1 ? 1 : current.quantity,
        },
      }
    })
  }

  const handleQuantityChange = (moduleId: string, value: number) => {
    const current = modulesState[moduleId]
    const minAllowed = current?.isEnabled ? 1 : 0
    const clamped = Math.max(minAllowed, value)
    setModulesState((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] ?? { isEnabled: false, quantity: 1 }),
        quantity: clamped,
      },
    }))
  }

  const handleQuantityIncrement = (moduleId: string) => {
    setModulesState((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] ?? { isEnabled: false, quantity: 1 }),
        quantity: (prev[moduleId]?.quantity ?? 1) + 1,
      },
    }))
  }

  const handleQuantityDecrement = (moduleId: string) => {
    setModulesState((prev) => {
      const current = prev[moduleId] ?? { isEnabled: false, quantity: 1 }
      const minAllowed = current.isEnabled ? 1 : 0
      return {
        ...prev,
        [moduleId]: {
          ...current,
          quantity: Math.max(minAllowed, current.quantity - 1),
        },
      }
    })
  }

  const onSubmit = async (values: Record<string, unknown>) => {
    if (!token) {
      notify.error(t("no_token"))
      return
    }

    setIsSubmitting(true)

    const dto: CreateTenantDto = {
      name: (values.name as string) || null,
      contactEmail: (values.contactEmail as string) || null,
      phone: (values.phone as string) || null,
      address: (values.address as string) || null,
      countryCode: (values.countryCode as string) || null,
      maxRegisters: (values.maxRegisters as number) ?? 1,
      adminIdentification: (values.adminIdentification as string) || null,
      subdomain: (values.subdomain as string) || null,
      identificationNumber: (values.identificationNumber as string) || null,
      identificationTypeId: (values.identificationTypeId as number) ?? 0,
      maxBranches: (values.maxBranches as number) ?? 0,
      maxUsers: (values.maxUsers as number) ?? 0,
      timeZoneId: (values.timeZoneId as string) || null,
    }

    try {
      const result = await createTenant(dto)

      const moduleItems: BulkUpdateTenantModuleItemDto[] = Object.entries(modulesState)
        .filter(([, state]) => state.isEnabled || state.quantity > 0)
        .map(([moduleId, state]) => ({
          modulePublicId: moduleId,
          isEnabled: state.isEnabled,
          quantity: state.quantity,
        }))

      if (moduleItems.length > 0) {
        await bulkUpdateTenantModules(token, result.id, moduleItems)
      }

      notify.success(t("tenant_created"))
      setCreatedResult(result)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("unable_to_save")
      notify.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Tenant Data */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t("tenant_data_title")}</CardTitle>
                  <CardDescription className="text-sm">{t("tenant_data_description")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="size-4 text-muted-foreground" />
                        {t("name")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("name_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-4 text-muted-foreground" />
                        {t("contact_email")}
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t("email_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="size-4 text-muted-foreground" />
                        {t("phone")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("phone_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-4 text-muted-foreground" />
                        {t("address")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("address_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Flag className="size-4 text-muted-foreground" />
                      {t("country")}
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("country_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CO">Colombia (CO)</SelectItem>
                        <SelectItem value="MX">México (MX)</SelectItem>
                        <SelectItem value="AR">Argentina (AR)</SelectItem>
                        <SelectItem value="PE">Perú (PE)</SelectItem>
                        <SelectItem value="CL">Chile (CL)</SelectItem>
                        <SelectItem value="EC">Ecuador (EC)</SelectItem>
                        <SelectItem value="ES">España (ES)</SelectItem>
                        <SelectItem value="US">Estados Unidos (US)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeZoneId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="size-4 text-muted-foreground" />
                      {t("time_zone")}
                    </FormLabel>
                    <Select
                      value={field.value || TIME_ZONE_AUTO}
                      onValueChange={(value) => field.onChange(value === TIME_ZONE_AUTO ? "" : value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("time_zone_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TIME_ZONE_AUTO}>{t("time_zone_auto")}</SelectItem>
                        {getTimeZoneOptions().map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t("time_zone_hint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxRegisters"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Hash className="size-4 text-muted-foreground" />
                      {t("max_registers")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("max_registers_placeholder")}
                        className="h-11 max-w-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Admin Data */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t("admin_data_title")}</CardTitle>
                  <CardDescription className="text-sm">{t("admin_data_description")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="adminIdentification"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4 text-muted-foreground" />
                      {t("admin_identification")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t("admin_identification_placeholder")} className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Globe className="size-4 text-muted-foreground" />
                        {t("subdomain")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("subdomain_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identificationNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="size-4 text-muted-foreground" />
                        {t("identification_number")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("identification_number_placeholder")} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="identificationTypeId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4 text-muted-foreground" />
                      {t("identification_type")}
                    </FormLabel>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("identification_type_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={String(DocumentType.CedulaCiudadania)}>{t("doc_type_cc")}</SelectItem>
                        <SelectItem value={String(DocumentType.CedulaExtranjeria)}>{t("doc_type_ce")}</SelectItem>
                        <SelectItem value={String(DocumentType.NIT)}>{t("doc_type_nit")}</SelectItem>
                        <SelectItem value={String(DocumentType.TarjetaIdentidad)}>{t("doc_type_ti")}</SelectItem>
                        <SelectItem value={String(DocumentType.Pasaporte)}>{t("doc_type_pa")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="maxBranches"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="size-4 text-muted-foreground" />
                        {t("max_branches")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder={t("max_branches_placeholder")}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxUsers"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4 text-muted-foreground" />
                        {t("max_users")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder={t("max_users_placeholder")}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t("modules_selection_title")}</CardTitle>
                  <CardDescription className="text-sm">{t("modules_selection_description")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {catalogLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : catalogModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_modules_found")}</p>
              ) : (
                <div className="space-y-2">
                  {catalogModules.map((module) => {
                    const state = modulesState[module.id] ?? {
                      isEnabled: false,
                      quantity: 1,
                    }
                    return (
                      <div
                        key={module.id}
                        className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          state.isEnabled ? "border-primary/30 bg-primary/5" : "border-border/50 bg-background/45"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <Switch
                            checked={state.isEnabled}
                            onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                            disabled={isSubmitting}
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{module.name}</span>
                              <Badge tone="neutral" className="text-[10px]">
                                {module.code}
                              </Badge>
                            </div>
                            {module.description ? (
                              <p className="line-clamp-1 text-xs text-muted-foreground">{module.description}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          {isTenantOnlyModule(module.code) ? (
                            <span className="text-xs text-muted-foreground">{t("module_scope_tenant")}</span>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground">{t("module_quantity_label")}</span>
                              <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleQuantityDecrement(module.id)}
                                  disabled={isSubmitting}
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <Input
                                  type="number"
                                  className="w-14 border-0 bg-transparent text-center text-sm focus-visible:ring-0"
                                  min={0}
                                  value={state.quantity}
                                  onChange={(e) => handleQuantityChange(module.id, Number(e.target.value))}
                                  disabled={isSubmitting}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleQuantityIncrement(module.id)}
                                  disabled={isSubmitting}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/platform/tenants")} className="px-6">
              {t("back")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting && <Spinner IsButton />}
              {t("create_tenant")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Credenciales y seriales generados (solo se muestran una vez) */}
      <Dialog
        open={createdResult !== null}
        onOpenChange={(open) => {
          if (!open) navigate("/platform/tenants", { replace: true })
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("created_title")}</DialogTitle>
            <DialogDescription>{t("created_desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CreatedField label={t("admin_credentials")} value={createdResult?.adminUsername} />
              <CreatedField label={t("created_password")} value={createdResult?.adminTemporaryPassword} />
              <CreatedField label={t("created_pin")} value={createdResult?.adminTemporaryPin} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("created_serials")}</p>
              {createdResult?.serialCodes?.length ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-card/60 p-3">
                  {createdResult.serialCodes.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-mono">{s.serialCode}</span>
                      <Badge tone={s.status === "Unassigned" ? "warning" : "neutral"}>{s.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => navigate("/platform/tenants", { replace: true })} className="px-6">
              {t("created_continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreatedField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-medium break-all text-foreground">{value || "—"}</p>
    </div>
  )
}
