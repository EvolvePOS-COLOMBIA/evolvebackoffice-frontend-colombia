import type { OrderDetail, OrderItemDto, OrderListItem } from "@/features/business/orders/types/api"
import type {
  PrintTemplateMappingDto,
  PrinterXHealthResponse,
  PrinterXPrintRequest,
  PrinterXPrintResponse,
  PrinterXPrinter,
  PrinterXTemplate,
} from "../types/print"

export const DEFAULT_PRINTERX_URL = "http://localhost:5055"
const ACTIVE_REGISTER_STORAGE_KEY = "evolvepos:active-register-id"
const REQUEST_TIMEOUT_MS = 4000

export function getActiveRegisterId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_REGISTER_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setActiveRegisterId(registerId: string | null): void {
  try {
    if (registerId) {
      window.localStorage.setItem(ACTIVE_REGISTER_STORAGE_KEY, registerId)
    } else {
      window.localStorage.removeItem(ACTIVE_REGISTER_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

function normalizeBaseUrl(serviceUrl: string): string {
  const trimmed = (serviceUrl || "").trim().replace(/\/+$/, "")
  return trimmed || DEFAULT_PRINTERX_URL
}

async function fetchLocalJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(text || `PrinterX respondió con estado ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

export function checkPrinterXHealth(serviceUrl: string): Promise<PrinterXHealthResponse> {
  return fetchLocalJson<PrinterXHealthResponse>(`${normalizeBaseUrl(serviceUrl)}/health`)
}

export function getPrinterXTemplates(serviceUrl: string): Promise<PrinterXTemplate[]> {
  return fetchLocalJson<PrinterXTemplate[]>(`${normalizeBaseUrl(serviceUrl)}/api/templates`)
}

export function getPrinterXPrinters(serviceUrl: string): Promise<PrinterXPrinter[]> {
  return fetchLocalJson<PrinterXPrinter[]>(`${normalizeBaseUrl(serviceUrl)}/api/printers`)
}

export function sendPrinterXPrintJob(
  serviceUrl: string,
  payload: PrinterXPrintRequest
): Promise<PrinterXPrintResponse> {
  return fetchLocalJson<PrinterXPrintResponse>(`${normalizeBaseUrl(serviceUrl)}/api/print`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

function formatOrderDate(isoDate?: string): string {
  if (!isoDate) return ""
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCopAmount(amount: number): string {
  return `$ ${Math.round(amount).toLocaleString("es-CO")}`
}

function parseModifiersText(modifiersJson?: string | null): string | null {
  if (!modifiersJson) return null
  try {
    const parsed = JSON.parse(modifiersJson) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    const names = parsed
      .map((m) => {
        if (typeof m === "string") return m
        if (m && typeof m === "object" && "name" in m) {
          const item = m as { name?: string; quantity?: number }
          return item.name ? `${item.name}${item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ""}` : null
        }
        return null
      })
      .filter((x): x is string => Boolean(x))
    return names.length > 0 ? names.join(", ") : null
  } catch {
    return null
  }
}

export type PrintableOrder = OrderDetail | (OrderListItem & Partial<OrderDetail>)

/** Construye el payload esperado por PrinterX para imprimir una comanda de cocina. */
export function buildKitchenOrderPrintRequest(
  order: PrintableOrder,
  mapping: PrintTemplateMappingDto
): PrinterXPrintRequest {
  const orderNumber = order.externalOrderId?.trim() || order.id.slice(0, 8)
  const rawItems: OrderItemDto[] = order.items ?? []
  const items = rawItems.map((item) => ({
    cantidad: item.quantity,
    descripcion: item.name,
    notas: null,
    extras: parseModifiersText(item.modifiersJson),
    total: formatCopAmount(item.subtotal),
  }))

  const createdAt = "createdAt" in order ? order.createdAt : order.externalCreatedAt

  return {
    printerName: mapping.printerName || null,
    templateId: mapping.templateId,
    type: "HtmlTemplate",
    format: mapping.format || "Ticket80mm",
    documentTitle: `Comanda Pedido #${orderNumber}`,
    copies: mapping.copies || 1,
    cutPaper: true,
    openCashDrawer: false,
    data: {
      orden: {
        numero: orderNumber,
        fecha: formatOrderDate(createdAt || order.externalCreatedAt),
        mesa: order.branchName ?? "POS",
        mesero: order.origin || order.platformCode || "POS",
        tipo: order.shippingCost > 0 || order.shippingStreet ? "Domicilio" : "Local",
        notas_generales: order.notes ?? order.shippingNotes ?? null,
      },
      cliente: {
        nombre: order.customerName || order.personName || "Consumidor Final",
        documento: "",
      },
      items,
    },
  }
}

/** Construye el payload esperado por PrinterX para imprimir el recibo del cliente. */
export function buildCustomerReceiptPrintRequest(
  order: PrintableOrder,
  mapping: PrintTemplateMappingDto
): PrinterXPrintRequest {
  const orderNumber = order.externalOrderId?.trim() || order.id.slice(0, 8)
  const rawItems: OrderItemDto[] = order.items ?? []
  const items = rawItems.map((item) => ({
    cantidad: item.quantity,
    descripcion: item.name,
    precio_unitario: formatCopAmount(item.unitPrice),
    extras: parseModifiersText(item.modifiersJson),
    total: formatCopAmount(item.subtotal),
  }))

  const createdAt = "createdAt" in order ? order.createdAt : order.externalCreatedAt
  const subtotal = "subtotal" in order && typeof order.subtotal === "number" ? order.subtotal : order.total
  const tax = "tax" in order && typeof order.tax === "number" ? order.tax : 0
  const discount = "discount" in order && typeof order.discount === "number" ? order.discount : 0
  const shippingCost = order.shippingCost ?? 0

  return {
    printerName: mapping.printerName || null,
    templateId: mapping.templateId,
    type: "HtmlTemplate",
    format: mapping.format || "Ticket80mm",
    documentTitle: `Recibo Pedido #${orderNumber}`,
    copies: mapping.copies || 1,
    cutPaper: true,
    openCashDrawer: false,
    data: {
      orden: {
        numero: orderNumber,
        fecha: formatOrderDate(createdAt || order.externalCreatedAt),
        sucursal: order.branchName ?? "POS",
        origen: order.origin || order.platformCode || "POS",
        tipo: shippingCost > 0 || order.shippingStreet ? "Domicilio" : "Local",
        metodo_pago: "paymentMethod" in order ? (order.paymentMethod ?? "Efectivo") : "Efectivo",
        notas_generales: order.notes ?? order.shippingNotes ?? null,
      },
      cliente: {
        nombre: order.customerName || order.personName || "Consumidor Final",
        telefono: order.phone ?? "",
        direccion: order.shippingStreet ?? "",
        ciudad: order.shippingCity ?? "",
      },
      items,
      totales: {
        subtotal: formatCopAmount(subtotal),
        descuento: formatCopAmount(discount),
        impuesto: formatCopAmount(tax),
        envio: formatCopAmount(shippingCost),
        total: formatCopAmount(order.total),
      },
    },
  }
}
