import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2, Printer, RefreshCw, Unplug } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useRegisterPrintSettings, useUpsertRegisterPrintSettings } from "../hooks/use-register-print-settings"
import {
  DEFAULT_PRINTERX_URL,
  buildKitchenOrderPrintRequest,
  checkPrinterXHealth,
  getActiveRegisterId,
  getPrinterXPrinters,
  getPrinterXTemplates,
  sendPrinterXPrintJob,
  setActiveRegisterId,
  type PrintableOrder,
} from "../services/printerx.service"
import type { Register } from "../types"
import type {
  PrintPaperFormat,
  PrintTemplateMappingDto,
  PrinterXPrinter,
  PrinterXTemplate,
  RegisterPrintSettingsDto,
} from "../types/print"

interface RegisterPrintSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  register: Register | null
}

const DEFAULT_WINDOWS_PRINTER = "__default__"
const PAPER_FORMATS: PrintPaperFormat[] = ["Ticket80mm", "Ticket55mm", "Letter"]

/**
 * Diálogo para configurar el servicio local de impresión (PrinterX) y el mapeo
 * de plantillas por tipo de recibo para una caja registradora.
 */
export function RegisterPrintSettingsDialog({ open, onOpenChange, register }: RegisterPrintSettingsDialogProps) {
  const { t } = useTranslation("business-registers")
  const { data: settings, isLoading } = useRegisterPrintSettings(register?.id, open)

  if (!register) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Printer className="size-5 text-primary" />
            <DialogTitle>{t("print_dialog_title")}</DialogTitle>
          </div>
          <DialogDescription>
            {register.name} ({register.code})
          </DialogDescription>
        </DialogHeader>

        {isLoading || !settings ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <RegisterPrintSettingsForm
            key={`${register.id}-${settings.serviceUrl}-${settings.isEnabled}-${settings.mappings[0]?.templateId ?? ""}`}
            register={register}
            initialSettings={settings}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface RegisterPrintSettingsFormProps {
  register: Register
  initialSettings: RegisterPrintSettingsDto
  onClose: () => void
}

function RegisterPrintSettingsForm({ register, initialSettings, onClose }: RegisterPrintSettingsFormProps) {
  const { t } = useTranslation("business-registers")
  const upsertMutation = useUpsertRegisterPrintSettings()

  const kitchenMapping = initialSettings.mappings.find((m) => m.documentType === "KitchenOrder")

  const [serviceUrl, setServiceUrl] = useState(initialSettings.serviceUrl || DEFAULT_PRINTERX_URL)
  const [probeUrl, setProbeUrl] = useState(initialSettings.serviceUrl || DEFAULT_PRINTERX_URL)
  const [isEnabled, setIsEnabled] = useState(initialSettings.isEnabled)
  const [useOnThisDevice, setUseOnThisDevice] = useState(() => getActiveRegisterId() === register.id)

  const [templateId, setTemplateId] = useState(kitchenMapping?.templateId ?? "")
  const [templateName, setTemplateName] = useState(kitchenMapping?.templateName ?? "")
  const [printerName, setPrinterName] = useState(kitchenMapping?.printerName || DEFAULT_WINDOWS_PRINTER)
  const [format, setFormat] = useState<PrintPaperFormat>((kitchenMapping?.format as PrintPaperFormat) || "Ticket80mm")
  const [autoPrint, setAutoPrint] = useState(kitchenMapping?.autoPrint ?? false)
  const [copies, setCopies] = useState(kitchenMapping?.copies ?? 1)
  const [sendingTest, setSendingTest] = useState(false)

  const {
    data: probeData,
    isFetching: checkingConnection,
    isError: connectionFailed,
    refetch: refetchPrinterX,
  } = useQuery({
    queryKey: ["printerx-probe", probeUrl],
    queryFn: async () => {
      const [health, templates, printers] = await Promise.all([
        checkPrinterXHealth(probeUrl),
        getPrinterXTemplates(probeUrl).catch(() => [] as PrinterXTemplate[]),
        getPrinterXPrinters(probeUrl).catch(() => [] as PrinterXPrinter[]),
      ])
      return {
        health,
        templates: Array.isArray(templates) ? templates : [],
        printers: Array.isArray(printers) ? printers : [],
      }
    },
    retry: false,
    staleTime: 10_000,
  })

  const health = probeData?.health ?? null

  // Garantiza que la plantilla y la impresora guardadas sigan visibles aunque PrinterX esté apagado
  const templateOptions: Array<{ id: string; name: string; format?: string }> = [...(probeData?.templates ?? [])]
  if (templateId && !templateOptions.some((tpl) => tpl.id === templateId)) {
    templateOptions.unshift({ id: templateId, name: templateName || templateId, format })
  }

  const printerOptions: Array<{ name: string; isDefault?: boolean }> = [...(probeData?.printers ?? [])]
  if (printerName !== DEFAULT_WINDOWS_PRINTER && !printerOptions.some((p) => p.name === printerName)) {
    printerOptions.unshift({ name: printerName })
  }

  const handleTestConnection = async () => {
    const normalized = serviceUrl.trim() || DEFAULT_PRINTERX_URL
    if (normalized !== probeUrl) {
      setProbeUrl(normalized)
      return
    }
    const result = await refetchPrinterX()
    if (result.data?.health) {
      notify.success(t("print_connected_toast", { service: result.data.health.service }))
    } else {
      notify.error(t("print_connection_error"))
    }
  }

  const handleSelectTemplate = (selectedId: string) => {
    setTemplateId(selectedId)
    const found = templateOptions.find((tpl) => tpl.id === selectedId)
    setTemplateName(found?.name ?? selectedId)
    if (found?.format === "Ticket80mm" || found?.format === "Ticket55mm" || found?.format === "Letter") {
      setFormat(found.format)
    }
  }

  const handleSave = () => {
    if (isEnabled && !templateId) {
      notify.error(t("print_template_required"))
      return
    }

    const mappings: PrintTemplateMappingDto[] = templateId
      ? [
          {
            documentType: "KitchenOrder",
            templateId,
            templateName: templateName || templateId,
            printerName: printerName === DEFAULT_WINDOWS_PRINTER ? null : printerName,
            format,
            autoPrint,
            copies: Math.min(10, Math.max(1, Number(copies) || 1)),
          },
        ]
      : []

    upsertMutation.mutate(
      {
        registerId: register.id,
        payload: {
          serviceUrl: serviceUrl.trim() || DEFAULT_PRINTERX_URL,
          isEnabled,
          mappings,
        },
      },
      {
        onSuccess: () => {
          if (useOnThisDevice) {
            setActiveRegisterId(register.id)
          } else if (getActiveRegisterId() === register.id) {
            setActiveRegisterId(null)
          }
          notify.success(t("print_settings_saved"))
          onClose()
        },
        onError: (err) => notify.error(getApiErrorMessage(err, t("error_save"))),
      }
    )
  }

  const handleTestPrint = async () => {
    if (!templateId) {
      notify.error(t("print_template_required"))
      return
    }
    setSendingTest(true)
    try {
      const resolvedPrinter = printerName === DEFAULT_WINDOWS_PRINTER ? null : printerName
      const resolvedCopies = Math.min(10, Math.max(1, Number(copies) || 1))
      const selectedTemplate = probeData?.templates.find((tpl) => tpl.id === templateId)

      let sampleData: Record<string, unknown> | null = null
      if (selectedTemplate?.sampleDataJson) {
        try {
          const parsed = JSON.parse(selectedTemplate.sampleDataJson) as unknown
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            sampleData = parsed as Record<string, unknown>
          }
        } catch {
          // Si el JSON de ejemplo de la plantilla es inválido, se usa el payload estándar
        }
      }

      const payload = sampleData
        ? {
            printerName: resolvedPrinter,
            templateId,
            type: "HtmlTemplate" as const,
            format,
            documentTitle: `Prueba - ${selectedTemplate?.name || register.name}`,
            copies: resolvedCopies,
            cutPaper: true,
            openCashDrawer: false,
            data: sampleData,
          }
        : buildKitchenOrderPrintRequest(
            {
              id: "PRUEBA-001",
              externalOrderId: "PRUEBA-001",
              branchName: register.name,
              origin: "EvolvePOS",
              platformCode: "POS",
              shippingCost: 0,
              notes: "Impresión de prueba desde configuración de caja.",
              customerName: "Cliente de Prueba",
              createdAt: new Date().toISOString(),
              externalCreatedAt: new Date().toISOString(),
              items: [
                {
                  id: "test-item-1",
                  name: "Producto de Prueba",
                  quantity: 1,
                  unitPrice: 15000,
                  subtotal: 15000,
                  modifiersJson: null,
                },
              ],
            } as PrintableOrder,
            {
              documentType: "KitchenOrder",
              templateId,
              templateName: templateName || templateId,
              printerName: resolvedPrinter,
              format,
              autoPrint,
              copies: resolvedCopies,
            }
          )

      await sendPrinterXPrintJob(serviceUrl, payload)
      notify.success(t("print_test_sent"))
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t("print_connection_error")
      notify.error(message)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Estado de habilitación y vinculación a este equipo */}
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium">{t("print_enable_label")}</Label>
            <p className="text-xs text-muted-foreground">{t("print_enable_hint")}</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium">{t("print_bind_device_label")}</Label>
            <p className="text-xs text-muted-foreground">{t("print_bind_device_hint")}</p>
          </div>
          <Switch checked={useOnThisDevice} onCheckedChange={setUseOnThisDevice} />
        </div>
      </div>

      {/* Conexión con PrinterX local */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="printerx-url">{t("print_service_url")}</Label>
          {health ? (
            <Badge tone="success" className="gap-1">
              <CheckCircle2 className="size-3" />
              {t("print_status_connected")} ({health.machine || health.version})
            </Badge>
          ) : (
            <Badge tone="neutral" className="gap-1">
              <Unplug className="size-3" />
              {t("print_status_disconnected")}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            id="printerx-url"
            value={serviceUrl}
            onChange={(e) => setServiceUrl(e.target.value)}
            placeholder={DEFAULT_PRINTERX_URL}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleTestConnection()}
            disabled={checkingConnection}
          >
            <RefreshCw className={`mr-2 size-4 ${checkingConnection ? "animate-spin" : ""}`} />
            {t("print_test_connection")}
          </Button>
        </div>
        {connectionFailed ? <p className="text-xs text-destructive">{t("print_connection_error")}</p> : null}
      </div>

      <Separator />

      {/* Mapeo por tipo de recibo: Comanda de Cocina */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("print_receipt_section_title")}</h4>
          <p className="text-xs text-muted-foreground">{t("print_receipt_section_desc")}</p>
        </div>

        <div className="space-y-4 rounded-lg border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("print_doc_kitchen_order")}</span>
            <Badge tone="info">{t("print_doc_badge_active")}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("print_template_label")}</Label>
              <Select value={templateId} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={t("print_template_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("print_printer_label")}</Label>
              <Select value={printerName} onValueChange={setPrinterName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_WINDOWS_PRINTER}>{t("print_printer_default")}</SelectItem>
                  {printerOptions.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                      {p.isDefault ? ` (${t("print_default_tag")})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("print_format_label")}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as PrintPaperFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPER_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="print-copies">{t("print_copies_label")}</Label>
              <Input
                id="print-copies"
                type="number"
                min={1}
                max={10}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <Label className="text-sm">{t("print_auto_label")}</Label>
              <p className="text-xs text-muted-foreground">{t("print_auto_hint")}</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleTestPrint()}
          disabled={!health || !templateId || sendingTest}
        >
          {sendingTest ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Printer className="mr-2 size-4" />}
          {t("print_test_button")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t("save")}
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}
