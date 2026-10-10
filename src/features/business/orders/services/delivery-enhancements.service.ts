import { api } from "@/config/axios-client"
import type { DeliveryProof, DeliveryQuote, DeliveryRun, DeliveryZone } from "../types/enhancements"

const root = "/api/delivery-enhancements"
export async function getDeliveryZones(branchId: string): Promise<DeliveryZone[]> {
  return (await api.get<DeliveryZone[]>(`${root}/zones`, { params: { branchId } })).data
}
export async function saveDeliveryZone(zone: Omit<DeliveryZone, "id">, id?: string): Promise<DeliveryZone> {
  return (
    await api.request<DeliveryZone>({
      url: `${root}/zones${id ? `/${id}` : ""}`,
      method: id ? "put" : "post",
      data: zone,
    })
  ).data
}
export async function quoteDelivery(
  branchId: string,
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<DeliveryQuote> {
  return (await api.get<DeliveryQuote>(`${root}/quote`, { params: { branchId, latitude, longitude }, signal })).data
}
export async function getDeliveryRuns(branchId: string): Promise<DeliveryRun[]> {
  return (await api.get<DeliveryRun[]>(`${root}/runs`, { params: { branchId } })).data
}
export async function createDeliveryRun(shiftId: string, orderIds: string[]): Promise<DeliveryRun> {
  return (await api.post<DeliveryRun>(`${root}/runs`, { shiftId, orderIds })).data
}
export async function getDeliveryProof(orderId: string): Promise<DeliveryProof> {
  return (await api.get<DeliveryProof>(`${root}/orders/${orderId}/proof`)).data
}
