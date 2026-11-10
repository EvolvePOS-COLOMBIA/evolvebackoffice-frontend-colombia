import type { BadgeTone } from "@/components/ui/badge"
import type { ProductionStatus } from "../types/production"
import type { PurchaseOrderStatus, TransferStatus } from "../types/purchasing"

export const ORDER_STATUS_TONE: Record<PurchaseOrderStatus, BadgeTone> = {
  Draft: "neutral",
  Sent: "info",
  PartiallyDispatched: "warning",
  Dispatched: "primary",
  PartiallyReceived: "warning",
  Received: "success",
  Closed: "neutral",
  Cancelled: "danger",
}

export const TRANSFER_STATUS_TONE: Record<TransferStatus, BadgeTone> = {
  InTransit: "info",
  Received: "success",
  ReceivedWithDifferences: "warning",
  Closed: "neutral",
}

export const PRODUCTION_STATUS_TONE: Record<ProductionStatus, BadgeTone> = {
  Planned: "info",
  Completed: "success",
  Cancelled: "neutral",
  Voided: "danger",
}

/** Módulo que habilita Producción en una sucursal. */
export const PRODUCTION_MODULE = "PRODUCCION"

export const OPEN_ORDER_STATUSES: PurchaseOrderStatus[] = ["Sent", "PartiallyDispatched", "PartiallyReceived"]

export { formatDateTime } from "./units"
