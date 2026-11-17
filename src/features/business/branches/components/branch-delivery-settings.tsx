import { useState } from "react"
import { AlertTriangle, MapPin, ShoppingCart } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useBranchDeliverySettings,
  useUpdateBranchDeliverySettings,
} from "@/features/business/delivery/hooks/use-delivery"
import { ADVANCE_MODE, type BranchDeliverySettingsDto } from "@/features/business/delivery/types"
import { notify } from "@/hooks/use-notify"
import { getApiErrorMessage } from "@/utils/api-error"
import { useTranslation } from "@/i18n/use-i18n"
import { useUpdateBranch } from "../hooks/use-branches"
import type { Branch } from "../types"

type BranchDeliverySettingsProps = {
  branchId: string
  /** Sucursal ya cargada por la página de configuración. */
  branch: Branch | null
  /** True cuando la sucursal tiene el módulo DOMICILIOS asignado. */
  hasDeliveryModule: boolean
}

/**
 * Pestaña «Domicilios» de la configuración de sucursal: ubicación (lat/lng,
 * obligatoria para asignar el módulo) y configuración del módulo (base, % de
 * valor de domicilio y modelo de anticipo).
 */
export function BranchDeliverySettings({ branchId, branch, hasDeliveryModule }: BranchDeliverySettingsProps) {
  const { t } = useTranslation("business-branches")
  const { data: settings, isLoading: settingsLoading } = useBranchDeliverySettings(hasDeliveryModule ? branchId : null)
  const updateSettings = useUpdateBranchDeliverySettings()
  const updateBranch = useUpdateBranch()

  // Ubicación (siempre editable: es requisito previo para asignar el módulo).
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [locationError, setLocationError] = useState<string | null>(null)

  // Configuración del módulo.
  const [baseAmount, setBaseAmount] = useState("")
  const [percentage, setPercentage] = useState("100")
  const [advanceMode, setAdvanceMode] = useState(String(ADVANCE_MODE.Advance))
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // Sincronización de los formularios con los datos cargados. Ajuste durante el
  // render (patrón de user-form-dialog), en vez de setState en un efecto; solo
  // se resincroniza cuando cambian los datos de origen (refetchOnWindowFocus
  // está deshabilitado, así que no pisa ediciones en curso).
  //
  // `prev*` arranca en `undefined`, nunca con el dato actual: si la sucursal o
  // la configuración ya están cargadas al montar (volver a la pestaña, caché de
  // React Query o un refetch con datos idénticos, que conserva la misma
  // referencia por structural sharing), inicializarlas con el mismo objeto
  // haría que `!==` nunca se cumpliera y el formulario quedara vacío aunque el
  // GET devolviera los valores.
  const [prevBranch, setPrevBranch] = useState<Branch | null | undefined>(undefined)
  const [prevSettings, setPrevSettings] = useState<BranchDeliverySettingsDto | undefined>(undefined)
  if (branch !== prevBranch) {
    setPrevBranch(branch)
    if (branch) {
      setLatitude(branch.latitude ?? "")
      setLongitude(branch.longitude ?? "")
    }
  }
  if (settings !== prevSettings) {
    setPrevSettings(settings)
    if (settings) {
      setBaseAmount(settings.baseAmount != null ? String(settings.baseAmount) : "")
      setPercentage(String(settings.deliveryValuePercentage))
      setAdvanceMode(String(settings.advanceMode))
    }
  }

  const handleSaveLocation = () => {
    if (!branch) return
    const lat = Number(latitude.trim())
    const lng = Number(longitude.trim())
    // El backend mantiene las coordenadas cuando el campo va null, así que el
    // formulario exige las dos (la ubicación no se puede "vaciar" desde aquí).
    if (latitude.trim() === "" || longitude.trim() === "") {
      setLocationError(t("delivery_location_required"))
      return
    }
    const invalid = Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180
    if (invalid) {
      setLocationError(t("delivery_location_invalid"))
      return
    }
    setLocationError(null)
    updateBranch.mutate(
      {
        id: branchId,
        payload: {
          name: branch.name,
          adminUserId: branch.adminUserId || null,
          identification: branch.identification || null,
          address: branch.address || null,
          phone: branch.phone || null,
          email: branch.email || null,
          isSupplier: branch.isSupplier,
          latitude: lat,
          longitude: lng,
        },
      },
      {
        onSuccess: () => notify.success(t("delivery_location_saved")),
        onError: (err) => notify.error(getApiErrorMessage(err, t("delivery_location_save"))),
      }
    )
  }

  const handleSaveSettings = () => {
    const base = baseAmount.trim() === "" ? null : Number(baseAmount.trim())
    const pct = Number(percentage.trim())
    if (base != null && (Number.isNaN(base) || base < 0)) {
      setSettingsError(t("delivery_base_invalid"))
      return
    }
    if (percentage.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setSettingsError(t("delivery_percentage_invalid"))
      return
    }
    setSettingsError(null)
    updateSettings.mutate(
      {
        branchId,
        payload: {
          baseAmount: base,
          deliveryValuePercentage: pct,
          advanceMode: Number(advanceMode),
        },
      },
      {
        onSuccess: () => notify.success(t("delivery_settings_saved")),
        onError: (err) => notify.error(getApiErrorMessage(err, t("delivery_settings_save"))),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Ubicación de la sucursal */}
      <Card className="border-border/80 bg-card/70 shadow-none">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {t("delivery_location_title")}
          </CardTitle>
          <CardDescription>{t("delivery_location_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branch-latitude">{t("delivery_latitude")}</Label>
              <Input
                id="branch-latitude"
                inputMode="decimal"
                placeholder="4.7109886"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-longitude">{t("delivery_longitude")}</Label>
              <Input
                id="branch-longitude"
                inputMode="decimal"
                placeholder="-74.072092"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
          {locationError ? <p className="text-sm font-medium text-destructive">{locationError}</p> : null}
          <Button size="sm" disabled={updateBranch.isPending} onClick={handleSaveLocation}>
            {updateBranch.isPending ? t("delivery_saving") : t("delivery_location_save")}
          </Button>
        </CardContent>
      </Card>

      {/* Configuración del módulo */}
      <Card className="border-border/80 bg-card/70 shadow-none">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-primary" />
            {t("delivery_settings_title")}
          </CardTitle>
          <CardDescription>{t("delivery_settings_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {!hasDeliveryModule ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>{t("delivery_not_assigned")}</AlertTitle>
              <AlertDescription>{t("delivery_not_assigned_desc")}</AlertDescription>
            </Alert>
          ) : settingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="delivery-base">{t("delivery_base_label")}</Label>
                  <Input
                    id="delivery-base"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={baseAmount}
                    placeholder="0"
                    onChange={(e) => setBaseAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("delivery_base_hint")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-percentage">{t("delivery_percentage_label")}</Label>
                  <Input
                    id="delivery-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    inputMode="decimal"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("delivery_percentage_hint")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("delivery_advance_label")}</Label>
                  <Select value={advanceMode} onValueChange={setAdvanceMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(ADVANCE_MODE.Advance)}>{t("delivery_advance_with")}</SelectItem>
                      <SelectItem value={String(ADVANCE_MODE.NoAdvance)}>{t("delivery_advance_without")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("delivery_advance_hint")}</p>
                </div>
              </div>
              {settingsError ? <p className="text-sm font-medium text-destructive">{settingsError}</p> : null}
              <Button size="sm" disabled={updateSettings.isPending} onClick={handleSaveSettings}>
                {updateSettings.isPending ? t("delivery_saving") : t("delivery_settings_save")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
