import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useTranslation } from "@/i18n/use-i18n"
import { useNotify } from "@/hooks/use-notify"
import Spinner from "@/components/Spinner"
import { useBranchIntegrations, useCreateIntegration, useTestConnection, useSyncMenu } from "../hooks/use-orders"
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Truck, Store } from "lucide-react"

interface IntegrationConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  platform: string
}

export function IntegrationConfigDialog({ open, onOpenChange, branchId, platform }: IntegrationConfigDialogProps) {
  const { t } = useTranslation("business-orders")
  const notify = useNotify()

  const [step, setStep] = useState(0)
  const [baseUrl, setBaseUrl] = useState("")
  const [appId, setAppId] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [storeId, setStoreId] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const { data: integrations } = useBranchIntegrations(branchId)
  const existingIntegration = integrations?.find((i) => i.platformCode === platform && i.isActive)

  const createMutation = useCreateIntegration()
  const testMutation = useTestConnection()
  const syncMenuMutation = useSyncMenu()

  const isCluvi = platform === "CLUVI"
  const platformName = isCluvi ? "Cluvi" : "WooCommerce"
  const defaultBaseUrl = isCluvi ? "https://api.cluviplatform.click" : ""

  useEffect(() => {
    if (open) {
      setBaseUrl(existingIntegration?.baseUrl ?? defaultBaseUrl)
      setAppId("")
      setSecretKey("")
      setStoreId("")
      setTestResult(null)

      if (existingIntegration) {
        setStep(1)
        try {
          const settings = JSON.parse(existingIntegration.settingsJson ?? "{}")
          setStoreId(settings.storeId ?? "")
        } catch {
          /* ignore */
        }
      } else {
        setStep(0)
      }
    }
  }, [open, existingIntegration, defaultBaseUrl])

  const steps = [t("config_step_credentials"), t("config_step_verify"), t("config_step_menu")]

  const handleTestConnection = () => {
    if (!branchId) return
    const integrationId = existingIntegration?.id
    if (!integrationId) return
    setTestResult(null)
    testMutation.mutate(
      { branchId, integrationId },
      {
        onSuccess: (result) => setTestResult(result),
        onError: () => setTestResult({ success: false, message: t("connection_failed") }),
      }
    )
  }

  const handleSave = () => {
    if (!branchId) return
    const settingsJson = isCluvi ? JSON.stringify({ storeId }) : undefined

    createMutation.mutate(
      {
        branchId,
        dto: {
          platformCode: platform,
          isActive: true,
          baseUrl,
          apiKey: appId,
          apiSecret: secretKey,
          settingsJson,
        },
      },
      {
        onSuccess: (data) => {
          notify.success(t("save_integration"))
          // After create, the query will refetch and existingIntegration will update
          // Force step 1 after a short delay to allow query invalidation
          setTimeout(() => setStep(1), 500)
        },
        onError: () => notify.error(t("connection_failed")),
      }
    )
  }

  const handleSyncMenu = () => {
    if (!branchId || !existingIntegration) return
    syncMenuMutation.mutate(
      {
        branchId,
        integrationId: existingIntegration.id,
        menu: { products: [], categories: [], modifiers: [] },
      },
      {
        onSuccess: () => {
          notify.success(t("sync_success"))
          onOpenChange(false)
        },
        onError: () => notify.error(t("sync_failed")),
      }
    )
  }

  const PlatformIcon = isCluvi ? Truck : Store

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5" />
            {t("config_title")} — {platformName}
          </DialogTitle>
          {existingIntegration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              {t("integration_active")}
            </div>
          )}
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-12 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <Separator />

        {/* Step 0: Credentials */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("select_branch")}</Label>
              <Input value={branchId} disabled className="bg-muted text-xs" />
            </div>
            <div className="space-y-2">
              <Label>{t("base_url")}</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={defaultBaseUrl} />
            </div>
            <div className="space-y-2">
              <Label>{isCluvi ? t("app_id") : "Consumer Key"}</Label>
              <Input value={appId} onChange={(e) => setAppId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isCluvi ? t("secret_key") : "Consumer Secret"}</Label>
              <Input value={secretKey} onChange={(e) => setSecretKey(e.target.value)} type="password" />
            </div>
            {isCluvi && (
              <div className="space-y-2">
                <Label>{t("store_id")}</Label>
                <Input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="34511" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("close")}
              </Button>
              <Button onClick={handleSave} disabled={!appId || !secretKey || createMutation.isPending}>
                {createMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                {t("save_integration")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Verify */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("test_connection")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{existingIntegration?.baseUrl}</p>
                    {isCluvi && (
                      <p className="text-xs text-muted-foreground">
                        Store ID:{" "}
                        {existingIntegration?.settingsJson ? JSON.parse(existingIntegration.settingsJson).storeId : "—"}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleTestConnection} disabled={testMutation.isPending || !existingIntegration}>
                    {testMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                    {testMutation.isPending ? t("testing_connection") : t("test_connection")}
                  </Button>
                </div>
                {testResult && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResult.message}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("config_step_credentials")}
              </Button>
              <Button onClick={() => setStep(2)}>
                {t("config_step_menu")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Sync Menu (Cluvi only) */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isCluvi ? t("sync_menu") : "Sincronización"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCluvi ? (
                  <>
                    <p className="text-sm text-muted-foreground">{t("sync_menu_desc")}</p>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        Los artículos publicados de la sucursal se sincronizarán como productos del menú en Cluvi.
                      </p>
                    </div>
                    <Button onClick={handleSyncMenu} disabled={syncMenuMutation.isPending} className="w-full">
                      {syncMenuMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                      {syncMenuMutation.isPending ? t("syncing") : t("confirm_sync")}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      La integración con WooCommerce está configurada. Las órdenes se sincronizarán automáticamente.
                    </p>
                    <Button onClick={() => onOpenChange(false)} className="w-full">
                      {t("close")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("config_step_verify")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
