import { api } from "@/config/axios-client"
import type { PagedResult } from "../types"
import type {
  CreatePurchaseOrderDto,
  DifferenceReason,
  GoodsReceiptDto,
  LineInput,
  OrderLineTemplateDto,
  PurchaseOrderDto,
  PurchaseOrderSummaryDto,
  SuggestedLineDto,
  TransferDto,
  TransferSummaryDto,
} from "../types/purchasing"
import { INVENTORY_PAGE_SIZE } from "./inventory.service"

type Paged<T> = { data: T[]; totalCount: number }
const paged = <T>(data: Paged<T> | undefined): PagedResult<T> => ({
  items: data?.data ?? [],
  totalCount: data?.totalCount ?? 0,
})

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function getPurchaseOrders(params: {
  branchId: string
  direction: "outgoing" | "incoming"
  /** internal = pedidos entre sucursales · external = órdenes de compra a proveedores. */
  kind?: "internal" | "external"
  status?: string
  pageNumber: number
}): Promise<PagedResult<PurchaseOrderSummaryDto>> {
  const { data } = await api.get<Paged<PurchaseOrderSummaryDto>>("/api/purchase-orders", {
    params: { ...params, pageSize: INVENTORY_PAGE_SIZE },
  })
  return paged(data)
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderDto> {
  const { data } = await api.get<PurchaseOrderDto>(`/api/purchase-orders/${id}`)
  return data
}

export async function getOrderSuggestion(
  branchId: string,
  supplierBranchId: string | null
): Promise<SuggestedLineDto[]> {
  const { data } = await api.get<SuggestedLineDto[]>("/api/purchase-orders/suggestion", {
    params: { branchId, supplierBranchId: supplierBranchId ?? undefined },
  })
  return data ?? []
}

export async function getLastOrderLines(
  branchId: string,
  supplierBranchId: string | null,
  supplierId: string | null
): Promise<OrderLineTemplateDto[]> {
  const { data } = await api.get<OrderLineTemplateDto[]>("/api/purchase-orders/last", {
    params: { branchId, supplierBranchId: supplierBranchId ?? undefined, supplierId: supplierId ?? undefined },
  })
  return data ?? []
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderDto): Promise<PurchaseOrderDto> {
  const { data } = await api.post<PurchaseOrderDto>("/api/purchase-orders", payload)
  return data
}

export async function sendPurchaseOrder(id: string): Promise<PurchaseOrderDto> {
  const { data } = await api.post<PurchaseOrderDto>(`/api/purchase-orders/${id}/send`)
  return data
}

export async function dispatchPurchaseOrder(
  id: string,
  /** unitPrice por unidad base; null = precio de venta de la proveedora (o costo). */
  lines: { lineId: string; quantity: number; unitPrice: number | null }[] | null,
  notes: string | null
): Promise<TransferDto> {
  const { data } = await api.post<TransferDto>(`/api/purchase-orders/${id}/dispatch`, { lines, notes })
  return data
}

export async function receivePurchaseOrder(
  id: string,
  payload: {
    invoiceNumber: string | null
    notes: string | null
    lines: { lineId: string; quantity: number; unitCost: number }[]
  }
): Promise<GoodsReceiptDto> {
  const { data } = await api.post<GoodsReceiptDto>(`/api/purchase-orders/${id}/receive`, payload)
  return data
}

export async function closePurchaseOrder(id: string): Promise<PurchaseOrderDto> {
  const { data } = await api.post<PurchaseOrderDto>(`/api/purchase-orders/${id}/close`)
  return data
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrderDto> {
  const { data } = await api.post<PurchaseOrderDto>(`/api/purchase-orders/${id}/cancel`)
  return data
}

// ─── Envíos ───────────────────────────────────────────────────────────────────

export async function getTransfers(params: {
  branchId: string
  direction: "outgoing" | "incoming"
  status?: string
  pageNumber: number
}): Promise<PagedResult<TransferSummaryDto>> {
  const { data } = await api.get<Paged<TransferSummaryDto>>("/api/transfers", {
    params: { ...params, pageSize: INVENTORY_PAGE_SIZE },
  })
  return paged(data)
}

export async function getTransfer(id: string): Promise<TransferDto> {
  const { data } = await api.get<TransferDto>(`/api/transfers/${id}`)
  return data
}

export async function createTransfer(payload: {
  fromBranchId: string
  toBranchId: string
  /** unitPrice por la presentación elegida; null = precio de venta de la proveedora (o costo). */
  lines: (LineInput & { unitPrice: number | null })[]
  notes: string | null
}): Promise<TransferDto> {
  const { data } = await api.post<TransferDto>("/api/transfers", payload)
  return data
}

export async function receiveTransfer(
  id: string,
  payload: {
    receiveAll: boolean
    lines: { lineId: string; quantity: number; reason: DifferenceReason | null }[] | null
    notes: string | null
  }
): Promise<TransferDto> {
  const { data } = await api.post<TransferDto>(`/api/transfers/${id}/receive`, payload)
  return data
}

export async function resolveTransferDifference(
  id: string,
  lineId: string,
  resolution: "lost" | "returned"
): Promise<TransferDto> {
  const { data } = await api.post<TransferDto>(`/api/transfers/${id}/lines/${lineId}/resolve`, { resolution })
  return data
}

// ─── Entradas de proveedor ────────────────────────────────────────────────────

export async function getGoodsReceipts(branchId: string, pageNumber: number): Promise<PagedResult<GoodsReceiptDto>> {
  const { data } = await api.get<Paged<GoodsReceiptDto>>("/api/goods-receipts", {
    params: { branchId, pageNumber, pageSize: INVENTORY_PAGE_SIZE },
  })
  return paged(data)
}

export async function createGoodsReceipt(payload: {
  branchId: string
  supplierId: string | null
  invoiceNumber: string | null
  notes: string | null
  lines: (LineInput & { unitCost: number })[]
}): Promise<GoodsReceiptDto> {
  const { data } = await api.post<GoodsReceiptDto>("/api/goods-receipts", payload)
  return data
}

export async function voidGoodsReceipt(id: string): Promise<GoodsReceiptDto> {
  const { data } = await api.post<GoodsReceiptDto>(`/api/goods-receipts/${id}/void`)
  return data
}
