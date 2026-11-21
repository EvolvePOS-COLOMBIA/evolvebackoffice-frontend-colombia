/** Campos que identifican un pedido (lista, detalle, turno de domicilios). */
export interface OrderReferenceSource {
  id: string
  orderNumber?: string | null
  externalOrderId?: string | null
}

/**
 * Referencia corta que ve el usuario, sin "#": el número del pedido en su
 * sucursal y día operativo ("100001"). Los pedidos sin número (creados antes
 * de la numeración) caen al identificador externo o al id recortados.
 */
export function orderReference(order: OrderReferenceSource): string {
  if (order.orderNumber) return order.orderNumber
  return order.externalOrderId?.slice(0, 8) || order.id.slice(0, 8)
}
