import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import {
  CheckCircle,
  Copy,
  KeyRound,
  Link2,
  ListChecks,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { appConfig } from "@/config/env"
import { notify } from "@/hooks/use-notify"
import { useAppStore } from "@/store/app-store"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"
import Spinner from "@/components/Spinner"
import { SettingRow, SettingsGroup } from "./config/settings-primitives"

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
  const defaultBaseUrl = isCluvi ? CLUVI_DEFAULT_BASE_URL : ""

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

  // While the list loads the form is not mounted, so its defaultValues always start from the
  // existing integration (if there is one).
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    )
  }

  const verified = testResult?.success === true
  const menuSynced = Boolean(syncResult) || Boolean(existingIntegration?.lastSyncedAtUtc)
  const storeOn = storeStatus === "on"

  const stepItems = [
    {
      label: t("config_step_credentials"),
      hint: existingIntegration ? t("cfg_step_credentials_done") : t("cfg_step_credentials_todo"),
      done: Boolean(existingIntegration),
    },
    {
      label: t("config_step_verify"),
      hint: verified ? t("cfg_step_verify_done") : t("cfg_step_verify_todo"),
      done: verified,
    },
    ...(isCluvi
      ? [
          {
            label: t("config_step_menu"),
            hint: menuSynced ? t("cfg_step_menu_done") : t("cfg_step_menu_todo"),
            done: menuSynced,
          },
          {
            label: t("cfg_step_webhook"),
            hint: storeOn ? t("cfg_step_webhook_done") : t("cfg_step_webhook_todo"),
            done: storeOn,
          },
        ]
      : []),
  ]

  const resultTone = (ok: boolean) =>
    ok
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : "border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 @2xl:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <SettingsGroup
            icon={PlatformIcon}
            title={t("cfg_integration_status")}
            aside={
              existingIntegration?.isActive ? (
                <Badge live tone="success">
                  {t("integration_active")}
                </Badge>
              ) : (
                <Badge tone="warning">
                  {existingIntegration ? t("integration_inactive") : t("integration_not_configured")}
                </Badge>
              )
            }
          >
            <SettingRow
              title={t("integration_last_sync")}
              description={
                existingIntegration?.lastSyncedAtUtc
                  ? formatDateTime(existingIntegration.lastSyncedAtUtc)
                  : t("integration_never_synced")
              }
            >
              {existingIntegration ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isMutating}
                  >
                    {testMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                    {testMutation.isPending ? t("integration_test_pending") : t("integration_test")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    aria-label={t("integration_delete")}
                    title={t("integration_delete")}
                    onClick={() => setDeleteOpen(true)}
                    disabled={isMutating}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t("cfg_integration_no_credentials")}</span>
              )}
            </SettingRow>
            {existingIntegration?.lastError ? (
              <p className="border-t border-border/70 px-4 py-3 text-xs text-destructive">
                {existingIntegration.lastError}
              </p>
            ) : null}
            {testResult ? (
              <div
                className={`m-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${resultTone(testResult.success)}`}
              >
                {testResult.success ? (
                  <CheckCircle className="size-4 shrink-0" />
                ) : (
                  <XCircle className="size-4 shrink-0" />
                )}
                {testResult.message}
              </div>
            ) : null}
          </SettingsGroup>

          <SettingsGroup icon={ListChecks} title={t("cfg_integration_steps")}>
            <ol className="p-4">
              {stepItems.map((item, index) => (
                <li key={item.label} className="relative grid grid-cols-[1.75rem_1fr] gap-3 py-2.5">
                  {index < stepItems.length - 1 ? (
                    <span
                      aria-hidden
                      className={`absolute top-9 -bottom-1.5 left-[0.8125rem] w-0.5 ${item.done ? "bg-emerald-400/50" : "bg-border"}`}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex size-6 items-center justify-center rounded-full border text-xs font-bold ${
                      item.done
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-500"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.done ? <CheckCircle className="size-3.5" /> : index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </li>
              ))}
            </ol>
          </SettingsGroup>
        </div>

        <div className="min-w-0 space-y-4">
          <SettingsGroup icon={KeyRound} title={t("cfg_integration_credentials")}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4 p-4">
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
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="border-t border-border/70">
                      <SettingRow
                        title={t("integration_form_is_active")}
                        description={t("integration_form_is_active_hint")}
                      >
                        <Switch
                          glow
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isMutating}
                          aria-label={t("integration_form_is_active")}
                        />
                      </SettingRow>
                    </div>
                  )}
                />

                <div className="flex justify-end border-t border-border/70 p-4">
                  <Button type="submit" disabled={isMutating}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {isNew ? t("integration_create") : t("integration_save")}
                  </Button>
                </div>
              </form>
            </Form>
          </SettingsGroup>

          {/* New-orders webhook and store status: Cluvi only, once the integration exists */}
          {isCluvi && existingIntegration ? (
            <SettingsGroup icon={Link2} title={t("webhook_url_title")}>
              <div className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">{t("webhook_url_desc")}</p>
                {storeStatus === "on" ? (
                  <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${resultTone(true)}`}>
                    <CheckCircle className="size-4 shrink-0" />
                    {t("store_active")}
                  </div>
                ) : storeStatus !== null ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                    <XCircle className="size-4 shrink-0" />
                    {t("store_inactive")}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
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
                      aria-label={t("new_order_url")}
                      disabled={!webhookUrl}
                      onClick={() => webhookUrl && copyText(webhookUrl, "webhook_copied")}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("ping_url")}</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={pingUrl} className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("ping_url")}
                      onClick={() => copyText(pingUrl, "ping_copied")}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <Button onClick={handleActivateStore} disabled={activateMutation.isPending} className="w-full">
                  {activateMutation.isPending && <Spinner className="mr-2 size-4" />}
                  {activateMutation.isPending ? t("setting_url") : t("set_webhook_url")}
                </Button>
                <p className="text-[11px] leading-4 text-muted-foreground">{t("webhook_url_hint")}</p>
              </div>
            </SettingsGroup>
          ) : null}
        </div>
      </div>

      {/* Menu sync: Cluvi only, once the integration exists */}
      {isCluvi && existingIntegration ? (
        <SettingsGroup icon={RefreshCw} title={t("sync_menu")}>
          <div className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">{t("sync_menu_desc")}</p>
            <p className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
              {t("sync_menu_items_hint")}
            </p>
            {syncResult ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [syncResult.products, t("products")],
                  [syncResult.categories, t("categories")],
                  [syncResult.modifiers, t("modifiers")],
                ].map(([value, label]) => (
                  <div key={String(label)} className="rounded-lg border border-border/70 bg-background/50 p-3">
                    <p className="text-xl font-semibold tracking-tight">{value}</p>
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <Button onClick={handleSyncMenu} disabled={syncMenuMutation.isPending} className="w-full sm:w-auto">
              {syncMenuMutation.isPending ? <Spinner className="mr-2 size-4" /> : <RefreshCw className="mr-2 size-4" />}
              {syncMenuMutation.isPending ? t("syncing") : t("confirm_sync")}
            </Button>
          </div>
        </SettingsGroup>
      ) : null}

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
