import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, SquarePen, Minus, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { tenantEditSchema as tenantSchema } from "@/features/platform/tenants/schemas/tenant-schema"
import type { CatalogModule, Tenant, TenantFormValues, TenantModuleAssignment } from "@/features/platform/tenants/types"
import { DocumentType } from "@/features/platform/tenants/types/api"
import { useModulesCatalog } from "@/features/platform/tenants/hooks/use-modules-catalog"
import { getTenantModules } from "@/features/platform/tenants/services/tenant-modules.service"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useTranslation } from "@/i18n/use-i18n"

type TenantFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantToEdit?: Tenant | null
  onSubmit: (values: TenantFormValues) => void
  isSubmitting?: boolean
}

type ModuleState = {
  isEnabled: boolean
  quantity: number
}

const defaultValues: TenantFormValues = {
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
  modules: [],
}

function buildModulesArray(catalog: CatalogModule[], state: Record<string, ModuleState>): TenantModuleAssignment[] {
  return catalog.map((m) => ({
    moduleId: m.id,
    isEnabled: state[m.id]?.isEnabled ?? false,
    quantity: state[m.id]?.quantity ?? 1,
  }))
}

export function TenantFormDialog({
  open,
  onOpenChange,
  tenantToEdit,
  onSubmit,
  isSubmitting = false,
}: TenantFormDialogProps) {
  const isEditMode = Boolean(tenantToEdit)
  const { t } = useTranslation("platform-tenants")
  const { session } = useAuth()
  const token = session?.accessToken

  const { data: catalogModules = [], isLoading: catalogLoading } = useModulesCatalog(token)
  const [modulesState, setModulesState] = useState<Record<string, ModuleState>>({})
  const [tenantModulesLoaded, setTenantModulesLoaded] = useState(false)

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema(t)) as unknown as Resolver<TenantFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    queueMicrotask(() => setTenantModulesLoaded(false))

    if (tenantToEdit) {
      form.reset({
        name: tenantToEdit.name,
        contactEmail: tenantToEdit.contactEmail,
        phone: tenantToEdit.phone,
        address: tenantToEdit.address,
        countryCode: tenantToEdit.countryCode ?? "",
        maxRegisters: tenantToEdit.maxRegisters,
        adminIdentification: "",
        subdomain: tenantToEdit.subdomain ?? "",
        identificationNumber: tenantToEdit.identificationNumber ?? "",
        identificationTypeId: tenantToEdit.identificationTypeId ?? 0,
        maxBranches: tenantToEdit.maxBranches ?? 0,
        maxUsers: tenantToEdit.maxUsers ?? 0,
        modules: [],
      })
    } else {
      form.reset(defaultValues)
    }
  }, [tenantToEdit, form, open])

  useEffect(() => {
    if (!open) return
    if (catalogModules.length === 0) return

    const defaultState: Record<string, ModuleState> = {}
    catalogModules.forEach((m) => {
      defaultState[m.id] = { isEnabled: false, quantity: 1 }
    })

    if (isEditMode && tenantToEdit && token) {
      queueMicrotask(() => setModulesState(defaultState))
      getTenantModules(token, tenantToEdit.tenantId)
        .then((tenantModules) => {
          const merged = { ...defaultState }
          tenantModules.forEach((tm) => {
            merged[tm.moduleId] = {
              isEnabled: tm.isEnabled,
              quantity: tm.quantity,
            }
          })
          setModulesState(merged)
          setTenantModulesLoaded(true)
        })
        .catch(() => {
          setModulesState(defaultState)
          setTenantModulesLoaded(true)
        })
    } else {
      queueMicrotask(() => {
        setModulesState(defaultState)
        setTenantModulesLoaded(true)
      })
    }
  }, [open, catalogModules, isEditMode, tenantToEdit, token])

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
    setModulesState((prev) => {
      const current = prev[moduleId]?.quantity ?? 1
      return {
        ...prev,
        [moduleId]: {
          ...(prev[moduleId] ?? { isEnabled: false, quantity: 1 }),
          quantity: current + 1,
        },
      }
    })
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

  const handleFormSubmit = (values: TenantFormValues) => {
    const modules = buildModulesArray(catalogModules, modulesState)
    onSubmit({ ...values, modules })
  }

  const modulesLoading = catalogLoading || (isEditMode && !tenantModulesLoaded)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[820px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_tenant") : t("create_tenant")}</DialogTitle>
          <DialogDescription>{t("fill_metadata")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleFormSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contact_email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("email_placeholder")} type="email" {...field} />
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
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("phone_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("address_placeholder")} {...field} />
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
                <FormItem>
                  <FormLabel>{t("country")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
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
              name="maxRegisters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("max_registers")}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder={t("max_registers_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="adminIdentification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin_identification")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("admin_identification_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("subdomain")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("subdomain_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="identificationTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("identification_type")}</FormLabel>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="identificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("identification_number")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("identification_number_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxBranches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("max_branches")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder={t("max_branches_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("max_users")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder={t("max_users_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{t("assigned_modules_section")}</h3>
                <p className="text-sm text-muted-foreground">{t("assigned_modules_section_desc")}</p>
              </div>

              {modulesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : catalogModules.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    {t("no_modules_found")}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {catalogModules.map((module) => {
                    const state = modulesState[module.id] ?? {
                      isEnabled: false,
                      quantity: 1,
                    }
                    return (
                      <Card key={module.id} className="rounded-2xl border-border/70 bg-background/45 shadow-none">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                            <div className="flex items-center gap-3 sm:justify-end sm:gap-4">
                              <div className="hidden text-sm text-muted-foreground sm:block">
                                {t("module_enabled_label")}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground sm:hidden">
                                  {t("module_quantity_label")}:
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityDecrement(module.id)}
                                  disabled={isSubmitting}
                                >
                                  <Minus className="size-4" />
                                </Button>
                                <Input
                                  type="number"
                                  className="w-20 text-center"
                                  min={0}
                                  value={state.quantity}
                                  onChange={(e) => handleQuantityChange(module.id, Number(e.target.value))}
                                  disabled={isSubmitting}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityIncrement(module.id)}
                                  disabled={isSubmitting}
                                >
                                  <Plus className="size-4" />
                                </Button>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-xs text-muted-foreground">{t("module_quantity_label")}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {!isEditMode && !modulesLoading && catalogModules.length > 0 ? (
                <p className="text-xs text-muted-foreground italic">{t("modules_save_info")}</p>
              ) : null}
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && (isEditMode ? <SquarePen className="size-4" /> : <Sparkles className="size-4" />)}
                {isEditMode ? t("update_tenant") : t("save_tenant")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
