import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Link2,
  Loader2,
  Plug,
  RefreshCw,
  Store,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/env"
import { notify } from "@/hooks/use-notify"
import { useAppStore } from "@/store/app-store"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"
import Spinner from "@/components/Spinner"

import {
  useActivateBranchIntegrationStore,
  useBranchIntegrations,
  useCreateBranchIntegration,
  useDeleteBranchIntegration,
  useSyncBranchIntegrationMenu,
  useTestBranchIntegrationConnection,
  useUpdateBranchIntegration,
} from "@/features/business/branches/hooks/use-branch-integrations"
import {
  CLUVI_DEFAULT_BASE_URL,
  readCluviStoreId,
  type CreateBranchIntegrationDto,
  type PlatformCode,
  type SyncMenuResponse,
  type TestConnectionResult,
  type UpdateBranchIntegrationDto,
} from "@/features/business/branches/types/integrations-api"

type Props = {
  branchId: string
  platform: PlatformCode
}

/**
 * Panel único de configuración de integraciones (ciclo completo: credenciales,
 * verificación, activación de tienda y sincronización de menú). Lo usan las
 * pestañas WooCommerce/Cluvi de la página de configuración de sucursal.
 */
export function IntegrationPanel({ branchId, platform }: Props) {
  const { t } = useTranslation("business-branches")

  const isCluvi = platform === "CLUVI"
  const platformName = isCluvi ? "Cluvi" : "WooCommerce"
  const defaultBaseUrl = isCluvi ? CLUVI_DEFAULT_BASE_URL : ""

  const [stepOverride, setStepOverride] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)
  // Estado de la tienda en Cluvi: "on" | "off" | null (aún desconocido)
  const [storeStatus, setStoreStatus] = useState<"on" | "off" | null>(null)
  // URLs que Cluvi quedó usando tras "Setear URL" (respuesta del servidor).
  // Antes de activar se muestran las calculadas con la config actual.
  const [registeredUrls, setRegisteredUrls] = useState<{ newOrder: string | null; ping: string | null } | null>(null)
  const [syncResult, setSyncResult] = useState<SyncMenuResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  // Evita repetir la verificación automática de estado en cada refetch.
  const statusCheckedRef = useRef(false)

  const { data: integrations, isLoading } = useBranchIntegrations(branchId)
  // Se busca por plataforma SIN filtrar por isActive: una integración guardada
  // pero desactivada (isActive=false) sigue existiendo en el backend y crear
  // otra produce 500 (índice único sucursal+plataforma).
  const existingIntegration = integrations?.find((i) => i.platformCode === platform) ?? null

  const createMutation = useCreateBranchIntegration()
  const updateMutation = useUpdateBranchIntegration()
  const deleteMutation = useDeleteBranchIntegration()
  const testMutation = useTestBranchIntegrationConnection()
  const syncMenuMutation = useSyncBranchIntegrationMenu()
  const activateMutation = useActivateBranchIntegrationStore()

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    testMutation.isPending ||
    activateMutation.isPending

  const isNew = !existingIntegration

  // En create las credenciales son obligatorias; en update se dejan en blanco
  // para conservar las guardadas (el backend solo las cambia con SetNew*).
  const secretMin = isNew ? 1 : 0

  const formSchema = z.object({
    baseUrl: z.string().min(1, "URL is required"),
    isActive: z.boolean(),
    apiKey: isCluvi ? z.string().min(secretMin, "App ID is required") : z.string().optional(),
    apiSecret: isCluvi ? z.string().min(secretMin, "Secret Key is required") : z.string().optional(),
    storeId: z.string().optional(),
    consumerKey: !isCluvi ? z.string().min(secretMin, "Consumer Key is required") : z.string().optional(),
    consumerSecret: !isCluvi ? z.string().min(secretMin, "Consumer Secret is required") : z.string().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseUrl: existingIntegration?.baseUrl ?? defaultBaseUrl,
      isActive: existingIntegration?.isActive ?? true,
      apiKey: "",
      apiSecret: "",
      storeId: readCluviStoreId(existingIntegration?.settingsJson),
      consumerKey: "",
      consumerSecret: "",
    },
  })

  // Valores derivados en render (sin useEffect): si el usuario no los cambió,
  // siguen a la integración existente —incluso si carga después de montar—.
  const step = stepOverride ?? (existingIntegration ? 1 : 0)
  const storeId = useWatch({ control: form.control, name: "storeId" })

  // URL del webhook que este backend expone para recibir pedidos (la misma
  // que activate-store registra en Cluvi) y su ping de salud.
  const tenantId = useAppStore((s) => s.session?.tenantId)
  const defaultWebhookUrl =
    tenantId && storeId
      ? `${appConfig.apiBaseUrl}/api/webhooks/cluvi/${tenantId}?storeId=${encodeURIComponent(storeId)}`
      : null
  const defaultPingUrl = `${appConfig.apiBaseUrl}/health`
  const webhookUrl = registeredUrls?.newOrder ?? defaultWebhookUrl
  const pingUrl = registeredUrls?.ping ?? defaultPingUrl

  const steps = isCluvi
    ? [t("config_step_credentials"), t("config_step_verify"), t("config_step_menu")]
    : [t("config_step_credentials"), t("config_step_verify")]

  const handleTestConnection = () => {
    if (!branchId || !existingIntegration) return
    setTestResult(null)
    testMutation.mutate(
      { branchId, id: existingIntegration.id },
      {
        onSuccess: (result) => {
          setTestResult(result)
          setStoreStatus(result.storeStatus ?? null)
        },
        onError: () => setTestResult({ success: false, message: t("integration_test_error") }),
      }
    )
  }

  // Al montar con una integración existente se verifica (una sola vez) el
  // estado real de la tienda en Cluvi vía Prueba de Conexión.
  useEffect(() => {
    if (!existingIntegration || statusCheckedRef.current) return
    statusCheckedRef.current = true
    handleTestConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingIntegration?.id])

  const copyText = async (value: string, successKey: string) => {
    try {
      await navigator.clipboard.writeText(value)
      notify.success(t(successKey))
    } catch {
      notify.error(t("copy_failed"))
    }
  }

  const onSubmit = (values: FormValues) => {
    if (!branchId) return
    const settingsJson = isCluvi ? JSON.stringify({ storeId: values.storeId ?? "" }) : undefined

    const onSuccess = () => {
      notify.success(isNew ? t("integration_create_success") : t("integration_save_success"))
      if (isNew) setStepOverride(1)
    }
    const onError = (err: unknown) => notify.error(err instanceof Error ? err.message : t("integration_save_error"))

    if (existingIntegration) {
      // Ya existe una integración para esta sucursal+plataforma (aunque esté
      // desactivada): se actualiza. Crear otra viola el índice único del
      // backend y responde 500. Los secretos solo se envían con su flag
      // SetNew* correspondiente (true solo si el usuario escribió uno nuevo).
      const dto: UpdateBranchIntegrationDto = {
        isActive: values.isActive,
        baseUrl: values.baseUrl,
        setNewApiKey: isCluvi && Boolean(values.apiKey),
        apiKey: isCluvi ? values.apiKey || undefined : undefined,
        setNewApiSecret: isCluvi && Boolean(values.apiSecret),
        apiSecret: isCluvi ? values.apiSecret || undefined : undefined,
        setNewConsumerKey: !isCluvi && Boolean(values.consumerKey),
        consumerKey: !isCluvi ? values.consumerKey || undefined : undefined,
        setNewConsumerSecret: !isCluvi && Boolean(values.consumerSecret),
        consumerSecret: !isCluvi ? values.consumerSecret || undefined : undefined,
        settingsJson,
      }
      updateMutation.mutate({ branchId, id: existingIntegration.id, dto }, { onSuccess, onError })
      return
    }

    const baseDto = { platformCode: platform, isActive: values.isActive, baseUrl: values.baseUrl }
    const dto: CreateBranchIntegrationDto = isCluvi
      ? {
          ...baseDto,
          apiKey: values.apiKey,
          apiSecret: values.apiSecret,
          settingsJson,
        }
      : {
          ...baseDto,
          consumerKey: values.consumerKey,
          consumerSecret: values.consumerSecret,
        }
    createMutation.mutate({ branchId, dto }, { onSuccess, onError })
  }

  const handleActivateStore = () => {
    if (!branchId || !existingIntegration) return
    activateMutation.mutate(
      { branchId, id: existingIntegration.id },
      {
        onSuccess: (res) => {
          if (res.success) {
            setStoreStatus(res.storeStatus === "off" ? "off" : "on")
            setRegisteredUrls({ newOrder: res.newOrderWebhookUrl, ping: res.pingWebhookUrl })
            notify.success(res.message ?? t("store_activated"))
          } else {
            notify.error(res.message ?? t("store_activation_failed"))
          }
        },
        onError: () => notify.error(t("store_activation_failed")),
      }
    )
  }

  const handleSyncMenu = () => {
    if (!branchId || !existingIntegration) return
    syncMenuMutation.mutate(
      { branchId, id: existingIntegration.id },
      {
        onSuccess: (res) => {
          if (res.success) {
            setSyncResult(res)
            notify.success(res.message ?? t("sync_success"))
          } else {
            notify.error(res.message ?? t("sync_failed"))
          }
        },
        onError: () => notify.error(t("sync_failed")),
      }
    )
  }

  const handleDelete = () => {
    if (!branchId || !existingIntegration) return
    deleteMutation.mutate(
      { branchId, id: existingIntegration.id },
      {
        onSuccess: () => {
          notify.success(t("integration_delete_success"))
          setDeleteOpen(false)
          setStepOverride(null)
          setTestResult(null)
          setStoreStatus(null)
          setRegisteredUrls(null)
          setSyncResult(null)
          statusCheckedRef.current = false
          form.reset({
            baseUrl: defaultBaseUrl,
            isActive: true,
            apiKey: "",
            apiSecret: "",
            storeId: "",
            consumerKey: "",
            consumerSecret: "",
          })
        },
        onError: (err) => notify.error(err instanceof Error ? err.message : t("integration_save_error")),
      }
    )
  }

  const PlatformIcon = isCluvi ? Truck : Store

  // Mientras carga la lista no se monta el formulario: así los defaultValues
  // siempre arrancan desde la integración existente (si la hay).
  if (isLoading) {
    return (
      <Card className="border-border/80 bg-card/70 shadow-none">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-8 w-1/3 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Status card */}
      {existingIntegration && (
        <Card className="rounded-2xl border-border/70 bg-card/60">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge tone={existingIntegration.isActive ? "success" : "warning"}>
                    {existingIntegration.isActive ? t("integration_active") : t("integration_inactive")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("integration_last_sync")}:
                    {existingIntegration.lastSyncedAtUtc
                      ? ` ${formatDateTime(existingIntegration.lastSyncedAtUtc)}`
                      : ` ${t("integration_never_synced")}`}
                  </span>
                </div>
                {existingIntegration.lastError && (
                  <p className="text-xs text-destructive">{existingIntegration.lastError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleTestConnection} disabled={isMutating}>
                  {testMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                  {t("integration_test")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isMutating}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle className="size-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 w-12 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>
      <Separator />

      {/* Step 0: Credentials */}
      {step === 0 && (
        <Card className="border-border/80 bg-card/70 shadow-none">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="flex items-center gap-2">
              <PlatformIcon className="size-5" />
              {t("integration_title", { platform: platformName })}
            </CardTitle>
            <CardDescription>{isCluvi ? t("cluvi_help_keys") : t("woocommerce_help_keys")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("integration_form_url")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("integration_form_url_placeholder")} {...field} disabled={isMutating} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {isCluvi ? t("cluvi_help_url") : t("woocommerce_help_url")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCluvi ? (
                  <>
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("app_id")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isMutating} />
                          </FormControl>
                          {!isNew && <p className="text-xs text-muted-foreground">{t("secret_keep_hint")}</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apiSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("secret_key")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isMutating} />
                          </FormControl>
                          {!isNew && <p className="text-xs text-muted-foreground">{t("secret_keep_hint")}</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="storeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("store_id")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("store_id_placeholder")} {...field} disabled={isMutating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="consumerKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("integration_form_consumer_key")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("integration_form_consumer_key_placeholder")}
                              {...field}
                              disabled={isMutating}
                            />
                          </FormControl>
                          {!isNew && <p className="text-xs text-muted-foreground">{t("secret_keep_hint")}</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="consumerSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("integration_form_consumer_secret")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("integration_form_consumer_secret_placeholder")}
                              type="password"
                              {...field}
                              disabled={isMutating}
                            />
                          </FormControl>
                          {!isNew && <p className="text-xs text-muted-foreground">{t("secret_keep_hint")}</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/70 bg-card/60 p-4">
                      <div className="space-y-0.5">
                        <FormLabel>{t("integration_form_is_active")}</FormLabel>
                        <p className="text-xs text-muted-foreground">{t("integration_form_is_active_hint")}</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isMutating} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  {existingIntegration && (
                    <Button type="button" variant="outline" onClick={() => setStepOverride(1)}>
                      {t("close")}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                  <Button type="submit" disabled={isMutating}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {isNew ? t("integration_create") : t("integration_save")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Verify */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("integration_test")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{existingIntegration?.baseUrl}</p>
                  {isCluvi && (
                    <p className="text-xs text-muted-foreground">
                      {t("store_id")}: {readCluviStoreId(existingIntegration?.settingsJson) || "—"}
                    </p>
                  )}
                </div>
                <Button onClick={handleTestConnection} disabled={testMutation.isPending || !existingIntegration}>
                  {testMutation.isPending && <Spinner className="mr-2 size-4" />}
                  {testMutation.isPending ? t("integration_test_pending") : t("integration_test")}
                </Button>
              </div>
              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {testResult.success ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                  {testResult.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL de pedidos (webhook) + estado de la tienda — solo Cluvi */}
          {isCluvi && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="size-4" />
                  {t("webhook_url_title")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("webhook_url_desc")}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Estado de la tienda: activa / inactiva / sin verificar */}
                {storeStatus === "on" ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle className="size-4 shrink-0" />
                    {t("store_active")}
                  </div>
                ) : storeStatus !== null ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <XCircle className="size-4 shrink-0" />
                    {t("store_inactive")}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {testMutation.isPending && <Spinner className="size-4" />}
                      {testMutation.isPending ? t("checking_store") : t("store_status_unknown")}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTestConnection}
                      disabled={testMutation.isPending || !existingIntegration}
                    >
                      <RefreshCw className="mr-1 size-3.5" />
                      {t("check_status")}
                    </Button>
                  </div>
                )}

                {/* Webhook de nuevas órdenes */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("new_order_url")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={webhookUrl ?? ""}
                      placeholder={t("webhook_url_placeholder")}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!webhookUrl}
                      onClick={() => webhookUrl && copyText(webhookUrl, "webhook_copied")}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Ping / health check */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("ping_url")}</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={pingUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyText(pingUrl, "ping_copied")}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleActivateStore}
                  disabled={activateMutation.isPending || !existingIntegration}
                  className="w-full"
                >
                  {activateMutation.isPending && <Spinner className="mr-2 size-4" />}
                  {activateMutation.isPending ? t("setting_url") : t("set_webhook_url")}
                </Button>
                <p className="text-[11px] leading-4 text-muted-foreground">{t("webhook_url_hint")}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStepOverride(0)}>
              <ArrowLeft className="mr-2 size-4" />
              {t("config_step_credentials")}
            </Button>
            {isCluvi && (
              <Button onClick={() => setStepOverride(2)}>
                {t("config_step_menu")}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Sync Menu (Cluvi only) */}
      {step === 2 && isCluvi && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("sync_menu")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("sync_menu_desc")}</p>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">{t("sync_menu_items_hint")}</p>
              </div>
              {syncResult && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border bg-background/50 p-3">
                    <p className="text-xl font-semibold tracking-tight">{syncResult.products}</p>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {t("products")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background/50 p-3">
                    <p className="text-xl font-semibold tracking-tight">{syncResult.categories}</p>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {t("categories")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background/50 p-3">
                    <p className="text-xl font-semibold tracking-tight">{syncResult.modifiers}</p>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {t("modifiers")}
                    </p>
                  </div>
                </div>
              )}
              <Button onClick={handleSyncMenu} disabled={syncMenuMutation.isPending} className="w-full">
                {syncMenuMutation.isPending && <Spinner className="mr-2 size-4" />}
                {syncMenuMutation.isPending ? t("syncing") : t("confirm_sync")}
              </Button>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setStepOverride(1)}>
              <ArrowLeft className="mr-2 size-4" />
              {t("config_step_verify")}
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("integration_delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("integration_delete_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("config_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("config_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
