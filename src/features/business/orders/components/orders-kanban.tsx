import type { CSSProperties } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus } from "../types/api"
import { Bike, Eye, Clock, MapPin } from "lucide-react"

interface OrdersKanbanProps {
  ordersByStatus: Record<string, OrderListItem[]>
  onDragEnd: (orderId: string, newStatus: OrderStatus) => void
  onViewDetail: (order: OrderListItem) => void
  /** En "todas las sucursales" cada tarjeta muestra su sucursal. */
  showBranch?: boolean
}

export function OrdersKanban({ ordersByStatus, onDragEnd, onViewDetail, showBranch = false }: OrdersKanbanProps) {
  const { t } = useTranslation("business-orders")

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    // Soltar en la misma columna no cambia el estado (evita un PUT inválido).
    if (result.destination.droppableId === result.source.droppableId) return
    const newStatus = result.destination.droppableId as OrderStatus
    const orderId = result.draggableId
    onDragEnd(orderId, newStatus)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const config = ORDER_STATUS_CONFIG[status]
          const orders = ordersByStatus[status] ?? []

          return (
            <div key={status} className="min-w-[270px] flex-1 sm:min-w-[300px]">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{config?.label}</CardTitle>
                    <Badge tone={config?.color}>{orders.length}</Badge>
                  </div>
                </CardHeader>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      }`}
                    >
                      {orders.length === 0 && (
                        <p className="py-8 text-center text-xs text-muted-foreground">{t("no_orders")}</p>
                      )}
                      {orders.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              // dnd tipa `style` con DraggableStyle; se reinterpreta
                              // como CSSProperties para compatibilidad con los
                              // index signatures de custom properties (--radix-*).
                              style={provided.draggableProps.style as CSSProperties}
                              className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow ${
                                snapshot.isDragging ? "shadow-md" : ""
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-1">
                                <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                                  #{order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                  {showBranch && order.branchName && (
                                    <Badge tone="info" className="max-w-28 truncate text-[10px]">
                                      {order.branchName}
                                    </Badge>
                                  )}
                                  <Badge tone="neutral" className="text-[10px]">
                                    {order.platformCode}
                                  </Badge>
                                </span>
                              </div>

                              <p className="mb-1 text-sm font-medium">${order.total.toFixed(2)}</p>
                              <p className="mb-1 text-xs font-semibold">
                                {order.paymentConfirmed
                                  ? t("phase2_paid")
                                  : t("phase2_collect", { amount: `$${order.total.toFixed(2)}` })}
                              </p>

                              {order.shippingStreet && (
                                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{order.shippingStreet}</span>
                                </div>
                              )}

                              {order.courierName && (
                                <div className="mb-1 flex items-center gap-1 text-xs text-primary">
                                  <Bike className="h-3 w-3" />
                                  <span className="truncate">{order.courierName}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(order.externalCreatedAt).toLocaleTimeString("es-CO", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onViewDetail(order)
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
