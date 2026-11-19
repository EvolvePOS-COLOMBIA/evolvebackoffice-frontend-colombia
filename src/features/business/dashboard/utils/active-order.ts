import { ORDER_STATUS_CONFIG } from "@/features/business/orders/types"
import type { OrderListItem } from "@/features/business/orders/types/api"
import type { DashboardActiveOrder } from "../services/dashboard.service"

const STATUS_ALIASES: Record<string, string> = {
  on_the_way: "Shipped",
  canceled: "Cancelled",
  needs_review: "NeedsReview",
}

const toKey = (value: string) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

/** Any status spelling the dashboard may send → the status code the orders module uses. */
export function normalizeOrderStatus(status: string): string {
  const key = toKey(status)
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key]
  return Object.keys(ORDER_STATUS_CONFIG).find((code) => toKey(code) === key) ?? status
}

/**
 * Seed for the order detail dialog. The dialog loads the full order by id and overrides these
 * values, so this only has to cover the first paint.
 */
export function toOrderListItem(order: DashboardActiveOrder): OrderListItem {
  const total = order.total ?? 0
  return {
    id: order.id,
    externalOrderId: null,
    platformCode: "",
    branchId: order.branchId ?? null,
    branchName: order.branchName ?? null,
    statusCode: normalizeOrderStatus(order.status),
    statusName: order.status,
    subTotal: total,
    tax: 0,
    discount: 0,
    shippingCost: 0,
    total,
    paymentMethod: order.paymentMethod || null,
    externalCreatedAt: "",
    externalUpdatedAt: null,
    createdAt: "",
    shippingCity: null,
    shippingStreet: order.address || null,
  }
}
