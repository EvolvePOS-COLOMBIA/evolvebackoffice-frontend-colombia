import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus } from "../types/api"
import { Eye, Clock, MapPin } from "lucide-react"

interface OrdersKanbanProps {
  ordersByStatus: Record<string, OrderListItem[]>
  onDragEnd: (orderId: string, newStatus: OrderStatus) => void
  onViewDetail: (order: OrderListItem) => void
}

export function OrdersKanban({ ordersByStatus, onDragEnd, onViewDetail }: OrdersKanbanProps) {
  const { t } = useTranslation("business-orders")

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
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
            <div key={status} className="min-w-[300px] flex-1">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{config?.label}</CardTitle>
                    <Badge variant={config?.color as "warning" | "info" | "purple" | "success"}>{orders.length}</Badge>
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
                              className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow ${
                                snapshot.isDragging ? "shadow-md" : ""
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between">
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {order.platformCode}
                                </Badge>
                              </div>

                              <p className="mb-1 text-sm font-medium">${order.total.toFixed(2)}</p>

                              {order.shippingStreet && (
                                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{order.shippingStreet}</span>
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
