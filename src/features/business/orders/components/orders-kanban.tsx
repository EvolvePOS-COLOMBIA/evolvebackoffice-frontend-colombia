import type { CSSProperties } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus } from "../types/api"
import { Eye, Clock, MapPin, Ban } from "lucide-react"

interface OrdersKanbanProps {
  ordersByStatus: Record<string, OrderListItem[]>
  onDragEnd: (orderId: string, newStatus: OrderStatus) => void
  onViewDetail: (order: OrderListItem) => void
  onCancelOrder?: (order: OrderListItem) => void
  /** En "todas las sucursales" cada tarjeta muestra su sucursal. */
  showBranch?: boolean
  showCancelled?: boolean
}

/**
 * Tablero Kanban de órdenes con columnas por estado, soporte de arrastrar y soltar (DnD)
 * y columna opcional de órdenes canceladas.
 */
export function OrdersKanban({
  ordersByStatus,
  onDragEnd,
  onViewDetail,
  onCancelOrder,
  showBranch = false,
  showCancelled = false,
}: OrdersKanbanProps) {
  const { t } = useTranslation("business-orders")

  /** Gestiona el evento de finalización del arrastre de una tarjeta en el tablero. */
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId as OrderStatus
    const orderId = result.draggableId
    onDragEnd(orderId, newStatus)
  }

  const columns = showCancelled ? ([...KANBAN_COLUMNS, "Cancelled"] as const) : KANBAN_COLUMNS

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* grow + min-h-0: ocupa el alto restante de la página y puede
          contraerse; sin min-h-0 el contenido de las columnas estira la fila. */}
      {/* pb-2: deja aire entre el borde inferior de las columnas y la
          scrollbar horizontal de esta fila. */}
      <div className="flex min-h-0 grow gap-4 overflow-x-auto pb-2">
        {columns.map((status) => {
          const config = ORDER_STATUS_CONFIG[status]
          const orders = ordersByStatus[status] ?? []

          return (
            <section key={status} className="min-w-67.5 flex-1 sm:min-w-75">
              <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card px-4 pb-4 text-card-foreground shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                <header className="my-3 shrink-0 border-b border-border/70 pb-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{config?.label}</h2>

                    <Badge tone={config?.color}>{orders.length}</Badge>
                  </div>
                </header>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <section
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      }`}
                    >
                      {orders.length === 0 && (
                        <p className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                          {t("no_orders")}
                        </p>
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
                              className={`rounded-lg border bg-primary/5 p-3 shadow-sm transition-shadow ${
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

                              {order.statusCode === "Cancelled" && (
                                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                  {order.cancellationType && (
                                    <Badge
                                      tone={order.cancellationType === "Waste" ? "warning" : "info"}
                                      className="px-1.5 py-0 text-[10px]"
                                    >
                                      {order.cancellationType === "Waste"
                                        ? t("cancellation_type_waste")
                                        : t("cancellation_type_restocked")}
                                    </Badge>
                                  )}
                                  {order.wasteCost != null && order.wasteCost > 0 && (
                                    <span className="font-mono text-[10px] font-medium text-destructive">
                                      -${order.wasteCost.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}

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
                                <div className="flex items-center gap-1">
                                  {order.statusCode !== "Delivered" &&
                                    order.statusCode !== "Cancelled" &&
                                    onCancelOrder && (
                                      <Button
                                        aria-label={t("cancel_order")}
                                        title={t("cancel_order")}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onCancelOrder(order)
                                        }}
                                      >
                                        <Ban className="h-3 w-3" />
                                      </Button>
                                    )}
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
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </section>
                  )}
                </Droppable>
              </div>
            </section>
          )
        })}
      </div>
    </DragDropContext>
  )
}
