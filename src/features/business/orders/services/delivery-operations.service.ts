import { api } from "@/config/axios-client"
import type { CourierMobile, DeliveryOperations } from "../types/operations"
import type { DeliveryProofInput } from "../types/enhancements"

export async function getDeliveryOperations(
  branchId: string | null,
  signal?: AbortSignal
): Promise<DeliveryOperations> {
  return (await api.get<DeliveryOperations>("/api/delivery-operations", { params: { branchId }, signal })).data
}

export async function deliveryAction<T = unknown>(
  path: string,
  payload?: unknown,
  method: "post" | "put" = "post"
): Promise<T> {
  return (await api.request<T>({ url: `/api/delivery-operations/${path}`, method, data: payload })).data
}

// DELIVERY uses the same tenant JWT client as the existing web login.
export async function getCourierMobile(): Promise<CourierMobile> {
  return (await api.get<CourierMobile>("/api/delivery/me")).data
}

export async function collectDelivery(
  id: string,
  tenderedAmount: number | null,
  proof: DeliveryProofInput | null = null
): Promise<void> {
  await api.post(`/api/delivery/me/orders/${id}/deliver`, { tenderedAmount, proof })
}
