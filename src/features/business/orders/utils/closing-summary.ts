import { ORDER_STATUS_CONFIG } from "../types"
import type { OrderClosingOrderRow } from "../types/closing"

export type ClosingStatusGroup = "open" | "done" | "cancelled"

const normalize = (value: string) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")

const STATUS_BY_KEY: Record<string, string> = {
  ...Object.fromEntries(Object.keys(ORDER_STATUS_CONFIG).map((code) => [normalize(code), code])),
  canceled: "Cancelled",
}

/** Backend spelling ("CANCELLED", "NEEDSREVIEW") → status code of the orders module. */
export function closingStatusCode(status: string): string | undefined {
  return STATUS_BY_KEY[normalize(status)]
}

/** In progress, finished or cancelled/refunded: the three buckets the closing screen filters by. */
export function statusGroup(status: string): ClosingStatusGroup {
  const code = closingStatusCode(status)
  if (code === "Delivered") return "done"
  if (code === "Cancelled" || code === "Refunded") return "cancelled"
  return "open"
}

/** "POSCO-aef188763e…" → "POSCO-aef188", the same short form the orders board shows. */
export function shortClosingReference(reference: string): string {
  const dash = reference.indexOf("-")
  if (dash === -1) return reference
  return `${reference.slice(0, dash + 1)}${reference.slice(dash + 1, dash + 7)}`
}

/** "TARJETA_CREDITO" → "Tarjeta credito": readable when the code has no configured name. */
export function humanizeCode(code: string): string {
  const text = code.replace(/_/g, " ").toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const sum = (orders: OrderClosingOrderRow[]) => orders.reduce((acc, order) => acc + order.total, 0)

export interface ClosingSummary {
  /** Orders that make up the closing total. */
  counted: OrderClosingOrderRow[]
  cancelled: { count: number; total: number }
  /** True when the backend total leaves the cancelled orders out. */
  excludesCancelled: boolean
  /** Counted orders that are still in progress. */
  open: { count: number; total: number }
  /** Counted total per declared payment method, biggest first. */
  byMethod: Array<{ code: string; total: number }>
}

/**
 * Reads the preview rows against the total the backend sends. The backend does not say whether
 * cancelled orders are part of that total, so it is detected: if the rest of the orders add up to
 * it, the cancelled ones are out.
 */
export function summarizeClosing(orders: OrderClosingOrderRow[], totalAmount: number): ClosingSummary {
  const cancelledOrders = orders.filter((order) => statusGroup(order.status) === "cancelled")
  const rest = orders.filter((order) => statusGroup(order.status) !== "cancelled")
  const excludesCancelled = cancelledOrders.length > 0 && sum(rest) === totalAmount
  const counted = excludesCancelled ? rest : orders

  const openOrders = counted.filter((order) => statusGroup(order.status) === "open")

  const totals = new Map<string, number>()
  for (const order of counted) {
    const code = order.declaredPaymentMethod ?? ""
    totals.set(code, (totals.get(code) ?? 0) + order.total)
  }

  return {
    counted,
    cancelled: { count: cancelledOrders.length, total: sum(cancelledOrders) },
    excludesCancelled,
    open: { count: openOrders.length, total: sum(openOrders) },
    byMethod: [...totals.entries()].map(([code, total]) => ({ code, total })).sort((a, b) => b.total - a.total),
  }
}
