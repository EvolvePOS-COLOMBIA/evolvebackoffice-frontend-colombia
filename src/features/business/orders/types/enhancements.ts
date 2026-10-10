export interface DeliveryZone {
  id: string
  branchId: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
  shippingCost: number
  priority: number
  isActive: boolean
}
export interface DeliveryQuote {
  zoneId: string
  zoneName: string
  shippingCost: number
}
export interface DeliveryRun {
  id: string
  shiftId: string
  courierName: string
  createdAt: string
  stops: { orderId: string; reference: string; position: number; status: string }[]
}
export interface DeliveryProofInput {
  kind: "Photo" | "Signature"
  contentType: string
  data: string
  receiverName?: string
}
export interface DeliveryProof extends DeliveryProofInput {
  orderId: string
  createdAt: string
}
