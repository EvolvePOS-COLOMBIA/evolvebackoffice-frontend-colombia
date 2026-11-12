import type { CSSProperties } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus } from "../types/api"
import { OrderCard } from "./order-card"

interface OrdersKanbanProps {
  ordersByStatus: Record<string, OrderListItem[]>
  onDragEnd: (orderId: string, newStatus: OrderStatus) => void
  onViewDetail: (order: OrderListItem) => void
  onCancelOrder?: (order: OrderListItem) => void
  /** En "todas las sucursales" cada tarjeta muestra su sucursal. */
  showBranch?: boolean
  showCancelled?: boolean
  /** Estado cuyas tarjetas muestran checkbox de selección múltiple (p. ej. "Ready"). */
  selectableStatus?: OrderStatus
  /** Ids seleccionados (selección múltiple para acciones por lote). */
  selectedIds?: Set<string>
  onToggleSelect?: (orderId: string) => void
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
  selectableStatus,
  selectedIds,
  onToggleSelect,
}: OrdersKanbanProps) {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()

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

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums" title={t("total")}>
                        {formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}
                      </span>
                      <Badge tone={config?.color}>{orders.length}</Badge>
                    </div>
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
                              className={`group flex items-start gap-2 rounded-lg border bg-primary/5 p-3 shadow-sm transition-shadow hover:border-primary/30 ${
                                snapshot.isDragging ? "shadow-md" : ""
                              }`}
                            >
                              {selectableStatus === status && onToggleSelect ? (
                                // stopPropagation evita que mousedown en el
                                // checkbox dispare el arrastre de la tarjeta.
                                <span
                                  className="mt-0.5 flex shrink-0 items-center"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={selectedIds?.has(order.id) ?? false}
                                    onCheckedChange={() => onToggleSelect(order.id)}
                                    aria-label={`#${order.externalOrderId?.slice(0, 8) ?? order.id.slice(0, 8)}`}
                                  />
                                </span>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <OrderCard
                                  order={order}
                                  showBranch={showBranch}
                                  priority={index < 8}
                                  onViewDetail={onViewDetail}
                                  onCancelOrder={onCancelOrder}
                                />
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
