import type { OrderListItem, OrderStockCheck, OrderStockItem } from "../types/api"

export const MAX_BULK_ORDERS = 50

/** Advertencia conjunta: dos pedidos pueden agotar stock aunque cada uno por separado quepa. */
export function bulkStockWarnings(orders: OrderListItem[], checks: OrderStockCheck[]): OrderStockItem[] {
  const grouped = new Map<string, OrderStockItem>()
  checks.forEach((check, index) => {
    check.items
      .filter((item) => item.tracksInventory)
      .forEach((item) => {
        const key = `${orders[index].branchId}:${item.itemId ?? `${orders[index].id}:${item.name}`}`
        const previous = grouped.get(key)
        grouped.set(
          key,
          previous
            ? {
                ...previous,
                requested: previous.requested + item.requested,
                available: Math.min(previous.available, item.available),
              }
            : { ...item }
        )
      })
  })
  return [...grouped.values()].filter((item) => item.requested > item.available)
}

export function isDeliveryOrder(order: OrderListItem): boolean {
  if (order.fulfillmentType?.toLowerCase() === "pickup") return false
  return order.fulfillmentType?.toLowerCase() === "delivery" || !!order.shippingStreet
}
