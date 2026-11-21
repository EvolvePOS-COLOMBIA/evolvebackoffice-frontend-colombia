import { useState } from "react"

import { useRegisterPrintSettings } from "@/features/business/registers/hooks/use-register-print-settings"
import {
  buildCustomerReceiptPrintRequest,
  buildKitchenOrderPrintRequest,
  getActiveRegisterId,
  sendPrinterXPrintJob,
  type PrintableOrder,
} from "@/features/business/registers/services/printerx.service"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

/**
 * Hook compartido para imprimir la comanda de cocina y el recibo del cliente
 * usando la configuración de PrinterX de la registradora vinculada a este equipo.
 */
export function usePrintComanda() {
  const { t } = useTranslation("business-orders")
  const activeRegisterId = getActiveRegisterId()
  const { data: printSettings } = useRegisterPrintSettings(activeRegisterId)
  const [isPrinting, setIsPrinting] = useState(false)

  const kitchenMapping = printSettings?.mappings.find((m) => m.documentType === "KitchenOrder")
  const receiptMapping = printSettings?.mappings.find((m) => m.documentType === "SaleReceipt")
  const isConfigured = Boolean(printSettings?.isEnabled && kitchenMapping?.templateId)
  const isCustomerReceiptConfigured = Boolean(printSettings?.isEnabled && receiptMapping?.templateId)

  const printComanda = async (order: PrintableOrder, options?: { autoOnly?: boolean }): Promise<boolean> => {
    if (!printSettings?.isEnabled || !kitchenMapping?.templateId) {
      if (!options?.autoOnly) notify.error(t("print_kitchen_not_configured"))
      return false
    }

    if (options?.autoOnly && !kitchenMapping.autoPrint) {
      return false
    }

    setIsPrinting(true)
    try {
      const payload = buildKitchenOrderPrintRequest(order, kitchenMapping)
      await sendPrinterXPrintJob(printSettings.serviceUrl, payload)
      notify.success(t("print_kitchen_sent"))
      return true
    } catch {
      notify.error(t("print_kitchen_failed"))
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  const printCustomerReceipt = async (order: PrintableOrder, options?: { autoOnly?: boolean }): Promise<boolean> => {
    if (!printSettings?.isEnabled || !receiptMapping?.templateId) {
      if (!options?.autoOnly) notify.error(t("print_receipt_not_configured"))
      return false
    }

    if (options?.autoOnly && !receiptMapping.autoPrint) {
      return false
    }

    setIsPrinting(true)
    try {
      const payload = buildCustomerReceiptPrintRequest(order, receiptMapping)
      await sendPrinterXPrintJob(printSettings.serviceUrl, payload)
      notify.success(t("print_receipt_sent"))
      return true
    } catch {
      notify.error(t("print_kitchen_failed"))
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printComanda,
    printCustomerReceipt,
    isPrinting,
    isConfigured,
    isCustomerReceiptConfigured,
    autoPrintEnabled: Boolean(isConfigured && kitchenMapping?.autoPrint),
    customerReceiptAutoPrintEnabled: Boolean(isCustomerReceiptConfigured && receiptMapping?.autoPrint),
  }
}
