import axios from "axios"
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

// Dedicated client: a courier capability never inherits a backoffice JWT or a tenant header.
const mobile = axios.create({ baseURL: api.defaults.baseURL })

export async function getCourierMobile(tenant: string, token: string): Promise<CourierMobile> {
  return (
    await mobile.get<CourierMobile>(`/api/courier-mobile/${encodeURIComponent(tenant)}`, {
      headers: { "X-Courier-Token": token },
    })
  ).data
}

export async function collectDelivery(
  tenant: string,
  token: string,
  id: string,
  tenderedAmount: number | null,
  proof: DeliveryProofInput | null = null
): Promise<void> {
  await mobile.post(
    `/api/courier-mobile/${encodeURIComponent(tenant)}/orders/${id}/deliver`,
    { tenderedAmount, proof },
    { headers: { "X-Courier-Token": token } }
  )
}
