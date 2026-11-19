import { useEffect, useState } from "react"
import { AlertTriangle, Bike, DollarSign, Zap } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useBranchDeliverySettings,
  useUpdateBranchDeliverySettings,
} from "@/features/business/delivery/hooks/use-delivery"
import { ADVANCE_MODE, type BranchDeliverySettingsDto } from "@/features/business/delivery/types"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import type { Branch } from "../../types"
import type { ConfigSectionId } from "./config-sections"
import { ModuleRequiredState } from "./module-required-state"
import { SaveBar, SectionShell, SettingRow, SettingsGroup } from "./settings-primitives"

const EXAMPLE_ORDER_TOTAL = 50_000

interface DeliverySectionProps {
  branchId: string
  branch: Branch
  /** True when the branch has the DOMICILIOS module assigned. */
  hasDeliveryModule: boolean
  onGoToSection: (section: ConfigSectionId) => void
  onDirtyChange?: (id: ConfigSectionId, dirty: boolean) => void
}

/** Delivery module settings: base for couriers, percentage of the delivery fee and advance model. */
export function DeliverySection({
  branchId,
  branch,
  hasDeliveryModule,
  onGoToSection,
  onDirtyChange,
}: DeliverySectionProps) {
  const { t } = useTranslation("business-branches")
  const { formatCurrency } = useLocaleFormat()
  const { data: settings, isLoading } = useBranchDeliverySettings(hasDeliveryModule ? branchId : null)
  const updateSettings = useUpdateBranchDeliverySettings()

  const [baseAmount, setBaseAmount] = useState("")
  const [percentage, setPercentage] = useState("100")
  const [advanceMode, setAdvanceMode] = useState(String(ADVANCE_MODE.Advance))
  const [error, setError] = useState<string | null>(null)

  // Syncs the form with the loaded settings during render (no setState in an effect). It only
  // resyncs when the source object changes, so it does not overwrite edits in progress.
  const [prevSettings, setPrevSettings] = useState<BranchDeliverySettingsDto | undefined>(undefined)
  if (settings !== prevSettings) {
    setPrevSettings(settings)
    if (settings) {
      setBaseAmount(settings.baseAmount != null ? String(settings.baseAmount) : "")
      setPercentage(String(settings.deliveryValuePercentage))
      setAdvanceMode(String(settings.advanceMode))
    }
  }

  const savedBase = settings?.baseAmount != null ? String(settings.baseAmount) : ""
  const isDirty =
    Boolean(settings) &&
    (baseAmount !== savedBase ||
      percentage !== String(settings?.deliveryValuePercentage) ||
      advanceMode !== String(settings?.advanceMode))

  useEffect(() => {
    onDirtyChange?.("delivery", isDirty)
  }, [isDirty, onDirtyChange])

  const discard = () => {
    if (!settings) return
    setBaseAmount(savedBase)
    setPercentage(String(settings.deliveryValuePercentage))
    setAdvanceMode(String(settings.advanceMode))
    setError(null)
  }

  const handleSave = () => {
    const base = baseAmount.trim() === "" ? null : Number(baseAmount.trim())
    const pct = Number(percentage.trim())
    if (base != null && (Number.isNaN(base) || base < 0)) {
      setError(t("delivery_base_invalid"))
      return
    }
    if (percentage.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError(t("delivery_percentage_invalid"))
      return
    }
    setError(null)
    updateSettings.mutate(
      { branchId, payload: { baseAmount: base, deliveryValuePercentage: pct, advanceMode: Number(advanceMode) } },
      {
        onSuccess: () => notify.success(t("delivery_settings_saved")),
        onError: (err) => notify.error(getApiErrorMessage(err, t("delivery_settings_save"))),
      }
    )
  }

  const pct = Math.min(100, Math.max(0, Number(percentage) || 0))
  const base = Number(baseAmount) || 0
  const fee = Math.round((EXAMPLE_ORDER_TOTAL * pct) / 100)
  const withAdvance = advanceMode === String(ADVANCE_MODE.Advance)
  const hasLocation = branch.latitude !== "" && branch.longitude !== ""

  return (
    <SectionShell
      icon={Bike}
      title={t("section_delivery")}
      description={t("section_delivery_desc")}
      footer={
        <SaveBar visible={isDirty} isPending={updateSettings.isPending} onSave={handleSave} onDiscard={discard} />
      }
    >
      {!hasDeliveryModule ? (
        <ModuleRequiredState
          icon={Bike}
          title={t("cfg_module_required_title", { module: t("section_delivery") })}
          description={t("cfg_delivery_locked_desc")}
          unlocks={[t("delivery_base_label"), t("delivery_percentage_label"), t("delivery_advance_label")]}
          hint={t("cfg_module_required_hint")}
          actionLabel={t("cfg_go_modules")}
          onAction={() => onGoToSection("modules")}
        />
      ) : isLoading ? (
        <Skeleton className="h-56 w-full rounded-2xl" />
      ) : (
        <>
          {!hasLocation ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>{t("cfg_delivery_no_location")}</AlertTitle>
              <AlertDescription className="space-y-2">
                <span>{t("cfg_delivery_no_location_desc")}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => onGoToSection("info")}>
                  {t("cfg_go_info")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid items-start gap-4 @2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <SettingsGroup icon={DollarSign} title={t("cfg_delivery_values")}>
              <SettingRow title={t("delivery_base_label")} description={t("delivery_base_hint")}>
                <MoneyInput
                  emit="string"
                  value={baseAmount}
                  placeholder="0"
                  aria-label={t("delivery_base_label")}
                  onChange={setBaseAmount}
                  className="w-44"
                />
              </SettingRow>
              <SettingRow title={t("delivery_percentage_label")} description={t("delivery_percentage_hint")}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputMode="decimal"
                  value={percentage}
                  aria-label={t("delivery_percentage_label")}
                  onChange={(event) => setPercentage(event.target.value)}
                  className="w-28 text-right"
                />
              </SettingRow>
              <SettingRow title={t("delivery_advance_label")} description={t("delivery_advance_hint")}>
                <Tabs value={advanceMode} onValueChange={setAdvanceMode}>
                  <TabsList aria-label={t("delivery_advance_label")}>
                    <TabsTrigger value={String(ADVANCE_MODE.Advance)}>{t("delivery_advance_with")}</TabsTrigger>
                    <TabsTrigger value={String(ADVANCE_MODE.NoAdvance)}>{t("delivery_advance_without")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </SettingRow>
              {error ? <p className="px-4 pb-3 text-sm font-medium text-destructive">{error}</p> : null}
            </SettingsGroup>

            <SettingsGroup
              icon={Zap}
              title={t("cfg_delivery_example")}
              aside={<Badge tone="info">{t("cfg_live")}</Badge>}
            >
              <div className="space-y-2 p-4 text-sm tabular-nums">
                <ExampleLine label={t("cfg_example_order")} value={formatCurrency(EXAMPLE_ORDER_TOTAL)} />
                <ExampleLine label={t("cfg_example_fee", { pct })} value={formatCurrency(fee)} />
                <ExampleLine label={t("cfg_example_base")} value={formatCurrency(base)} />
                <ExampleLine
                  highlight
                  label={withAdvance ? t("cfg_example_receives_advance") : t("cfg_example_receives_delivery")}
                  value={formatCurrency(withAdvance ? base + fee : fee)}
                />
              </div>
            </SettingsGroup>
          </div>
        </>
      )}
    </SectionShell>
  )
}

function ExampleLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "flex justify-between gap-3 rounded-lg bg-primary/10 px-3 py-2 font-semibold"
          : "flex justify-between gap-3 rounded-lg bg-foreground/[0.04] px-3 py-2"
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
