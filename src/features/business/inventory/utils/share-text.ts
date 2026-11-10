import type { TFunction } from "i18next"

import type { PurchaseOrderDto, TransferDto } from "../types/purchasing"
import type { WholesaleSaleDto } from "../types/sales"
import { formatInPackaging, formatMoney, formatQuantity, formatShortDate } from "./units"

function quantityText(quantity: number, baseUnit: number, packaging: { name: string; factor: number } | null) {
  const base = formatQuantity(quantity, baseUnit)
  const inPackaging = formatInPackaging(quantity, packaging)
  return inPackaging ? `${inPackaging} (${base})` : base
}

/** Resumen de un pedido para mandar por WhatsApp, copiar o imprimir. */
export function purchaseOrderShareText(order: PurchaseOrderDto, t: TFunction): string {
  const lines = order.lines.map((l) => {
    const packaging = l.packagingName && l.packagingFactor ? { name: l.packagingName, factor: l.packagingFactor } : null
    return `• ${l.itemName}: ${quantityText(l.quantityOrdered, l.baseUnit, packaging)}`
  })
  return [
    `${order.supplierBranchId ? t("share_order_heading") : t("share_po_heading")} ${order.number}`,
    `${t("share_ordered_by")}: ${order.branchName}`,
    `${t("share_ordered_to")}: ${order.supplierName}`,
    `${t("share_date")}: ${formatShortDate(order.sentAt ?? order.createdAt)}`,
    "",
    ...lines,
    ...(order.notes ? ["", `${t("share_note")}: ${order.notes}`] : []),
  ].join("\n")
}

/** Resumen de un envío: lo enviado y, si ya se recibió, lo recibido y las diferencias. */
export function transferShareText(transfer: TransferDto, t: TFunction): string {
  const received = transfer.status !== "InTransit"
  const lines = transfer.lines.map((l) => {
    const sent = formatQuantity(l.quantitySent, l.baseUnit)
    if (!received || l.quantityReceived === null) return `• ${l.itemName}: ${sent}`
    const got = formatQuantity(l.quantityReceived, l.baseUnit)
    return l.difference > 0
      ? `• ${l.itemName}: ${t("share_sent")} ${sent} · ${t("share_received")} ${got} · ${t("share_missing")} ${formatQuantity(l.difference, l.baseUnit)}`
      : `• ${l.itemName}: ${sent} ✓`
  })
  return [
    `${t("share_transfer_heading")} ${transfer.number}${transfer.purchaseOrderNumber ? ` (${transfer.purchaseOrderNumber})` : ""}`,
    `${t("share_from")}: ${transfer.fromBranchName}  →  ${t("share_to")}: ${transfer.toBranchName}`,
    `${t("share_date")}: ${formatShortDate(transfer.dispatchedAt)}`,
    "",
    ...lines,
    ...(transfer.notes ? ["", `${t("share_note")}: ${transfer.notes}`] : []),
  ].join("\n")
}

/** Resumen de una venta para el cliente: productos, cantidades y total (sin costos ni ganancia). */
export function saleShareText(sale: WholesaleSaleDto, t: TFunction): string {
  const lines = sale.lines.map((l) => {
    const packaging = l.packagingName && l.packagingFactor ? { name: l.packagingName, factor: l.packagingFactor } : null
    return `• ${l.itemName}: ${quantityText(l.quantity, l.baseUnit, packaging)} · ${formatMoney(l.total)}`
  })
  return [
    `${t("share_sale_heading")} ${sale.number}`,
    `${t("share_from")}: ${sale.branchName}${sale.customerName ? `  →  ${t("share_to")}: ${sale.customerName}` : ""}`,
    `${t("share_date")}: ${formatShortDate(sale.createdAt)}`,
    "",
    ...lines,
    "",
    `${t("sale_total")}: ${formatMoney(sale.total)}`,
    ...(sale.notes ? ["", `${t("share_note")}: ${sale.notes}`] : []),
  ].join("\n")
}
