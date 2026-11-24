import type { DeliveryShiftOrderDto } from "../types"

/**
 * Pedidos del turno pendientes de entrega: solo los «En camino» (los demás ya
 * se entregaron o se cancelaron), del más antiguo al más reciente para
 * entregarlos en el orden en que salieron.
 */
export function pendingDeliveries(orders: DeliveryShiftOrderDto[]): DeliveryShiftOrderDto[] {
  return orders.filter((o) => o.status === "Shipped").sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
