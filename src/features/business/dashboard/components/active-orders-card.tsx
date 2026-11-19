import { useState, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronRight, ClipboardList, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditOrderDialog } from "@/features/business/orders/components/edit-order-dialog"
import { OrderDetailDialog } from "@/features/business/orders/components/order-detail-dialog"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"
import type { DashboardActiveOrder } from "../services/dashboard.service"
import { toOrderListItem } from "../utils/active-order"

interface ActiveOrdersCardProps {
  orders: DashboardActiveOrder[]
  className?: string
}

type StatusConfig = { color: string; labelKey?: string; pulse: boolean }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { color: "#94a3b8", labelKey: "order_pending", pulse: true },
  confirmed: { color: "#06b6d4", labelKey: "order_confirmed", pulse: true },
  preparing: { color: "#f59e0b", labelKey: "order_preparing", pulse: true },
  ready: { color: "#3b82f6", labelKey: "order_ready", pulse: false },
  on_the_way: { color: "#8b5cf6", labelKey: "order_on_the_way", pulse: true },
  shipped: { color: "#8b5cf6", labelKey: "order_on_the_way", pulse: true },
  delivered: { color: "#22c55e", labelKey: "order_delivered", pulse: false },
  cancelled: { color: "#ef4444", labelKey: "order_cancelled", pulse: false },
  canceled: { color: "#ef4444", labelKey: "order_cancelled", pulse: false },
  refunded: { color: "#ef4444", labelKey: "order_cancelled", pulse: false },
}

const DEFAULT_STATUS_CONFIG: StatusConfig = { color: "#94a3b8", pulse: false }

function statusKey(status: string): string {
  return (status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[statusKey(status)] ?? DEFAULT_STATUS_CONFIG
}

interface OrderRowProps {
  order: DashboardActiveOrder
  index: number
  onOpen: (order: DashboardActiveOrder) => void
}

function OrderRow({ order, index, onOpen }: OrderRowProps) {
  const { t } = useTranslation("business-dashboard")
  const { formatCurrencyCompact } = useLocaleFormat()
  const config = getStatusConfig(order.status)
  const statusLabel = config.labelKey ? t(config.labelKey) : (order.status ?? "")
  const items = order.items ?? []
  const itemsPreview = items.slice(0, 2).join(", ")
  const moreItems = items.length > 2 ? ` +${items.length - 2}` : ""
  const itemCount = order.itemCount ?? items.length
  const progress = Math.min(100, Math.max(0, order.progress ?? 0))

  const open = () => onOpen(order)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      open()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      className="order-row group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card/40 px-4 pt-3.5 pb-3.5 transition-all duration-200 outline-none hover:border-border hover:bg-card/70 hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.customerName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {itemsPreview}
            {moreItems}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-base font-semibold text-foreground tabular-nums">
            {formatCurrencyCompact(order.total ?? 0)}
          </span>
          <ChevronRight
            aria-hidden
            className="size-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-medium ${config.pulse ? "animate-pulse" : ""}`}
          style={{
            backgroundColor: `color-mix(in oklch, ${config.color} 16%, transparent)`,
            color: config.color,
          }}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
        {order.branchName ? (
          <span className="inline-flex max-w-40 items-center gap-1 truncate" title={order.branchName}>
            <MapPin aria-hidden className="size-3 shrink-0" />
            <span className="truncate">{order.branchName}</span>
          </span>
        ) : null}
        <span>{order.createdAt}</span>
        <span>
          {itemCount} {t("order_items")}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={t("order_progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        title={`${t("order_progress")}: ${progress}%`}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/70"
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%`, backgroundColor: config.color }}
        />
      </div>
    </div>
  )
}

export function ActiveOrdersCard({ orders, className }: ActiveOrdersCardProps) {
  const { t } = useTranslation("business-dashboard")
  const navigate = useNavigate()
  const [selected, setSelected] = useState<DashboardActiveOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const activeCount = orders.filter((o) => statusKey(o.status) !== "delivered").length
  const deliveredCount = orders.filter((o) => statusKey(o.status) === "delivered").length

  const openOrder = (order: DashboardActiveOrder) => {
    setSelected(order)
    setDetailOpen(true)
  }

  return (
    <Card className={cn("flex flex-col transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between pb-2">
        <div className="flex flex-col items-start justify-between">
          <CardTitle className="text-lg font-semibold">{t("active_orders")}</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: CHART_PRIMARY }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_PRIMARY }}
                />
              </span>
              <span className="text-muted-foreground">
                {activeCount} {t("order_active")}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SECONDARY }} />
              <span className="text-muted-foreground">
                {deliveredCount} {t("order_done")}
              </span>
            </span>
          </div>
        </div>
        <Button className="group text-xs" variant="outline" size="sm" onClick={() => navigate("/business/orders")}>
          {t("view_all")}
          <ArrowRight className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ClipboardList aria-hidden className="size-8 opacity-50" />
            <p className="text-sm">{t("no_active_orders")}</p>
          </div>
        ) : (
          <div className="max-h-155 space-y-3 overflow-y-auto pr-1 lg:h-full lg:max-h-none">
            {orders.map((order, index) => (
              <OrderRow key={order.id} order={order} index={index} onOpen={openOrder} />
            ))}
          </div>
        )}
      </CardContent>

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selected ? toOrderListItem(selected) : null}
        onEdit={() => setEditOpen(true)}
      />
      <EditOrderDialog open={editOpen} onOpenChange={setEditOpen} orderId={selected?.id ?? null} />
    </Card>
  )
}
