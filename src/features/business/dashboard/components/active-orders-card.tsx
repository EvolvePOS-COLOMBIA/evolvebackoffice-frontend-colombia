import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"
import type { ActiveOrder, OrderStatus } from "../mock/dashboard-data"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { ArrowRight, Clock } from "lucide-react"

interface ActiveOrdersCardProps {
  orders: ActiveOrder[]
}

const STATUS_CONFIG: Record<OrderStatus, { color: string; labelKey: string; pulse: boolean }> = {
  pending: { color: "#94a3b8", labelKey: "order_pending", pulse: true },
  preparing: { color: "#f59e0b", labelKey: "order_preparing", pulse: true },
  ready: { color: "#3b82f6", labelKey: "order_ready", pulse: false },
  on_the_way: { color: "#8b5cf6", labelKey: "order_on_the_way", pulse: true },
  delivered: { color: "#22c55e", labelKey: "order_delivered", pulse: false },
}

function ProgressCircle({ progress, color, size = 36 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Background circle */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      {/* Progress arc — animates on mount */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        className="animate-[drawCircle_1s_ease-out_forwards]"
        style={{ strokeDashoffset: offset }}
      />
    </svg>
  )
}

function OrderRow({ order, t, index }: { order: ActiveOrder; t: (key: string) => string; index: number }) {
  const config = STATUS_CONFIG[order.status]
  const itemsPreview = order.items.slice(0, 2).join(", ")
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2}` : ""

  return (
    <div
      className="order-row group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3 transition-all duration-200 hover:scale-[1.01] hover:border-border hover:bg-card/60 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Order info — left */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{order.customerName}</span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium ${config.pulse ? "animate-pulse" : ""}`}
            style={{
              backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)`,
              color: config.color,
            }}
          >
            {t(config.labelKey)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {itemsPreview}
          {moreItems}
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span>{order.createdAt}</span>
          <span>·</span>
          <span>
            {order.itemCount} {t("order_items")}
          </span>
          <span>·</span>
          <span className="font-mono font-medium text-foreground tabular-nums">${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Progress circle — right */}
      <ProgressCircle progress={order.progress} color={config.color} />
    </div>
  )
}

export function ActiveOrdersCard({ orders }: ActiveOrdersCardProps) {
  const { t } = useTranslation("business-dashboard")

  const activeCount = orders.filter((o) => o.status !== "delivered").length
  const deliveredCount = orders.filter((o) => o.status === "delivered").length

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col items-start justify-between">
          <CardTitle className="text-lg font-semibold">{t("active_orders")}</CardTitle>
          <div className="flex items-center gap-2 text-xs">
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
        <Button
          className="group text-xs"
          variant="outline"
          size="sm"
          onClick={() => toast(t("not_implemented"), { icon: <Clock className="size-5 text-primary" /> })}
        >
          {t("view_all")}
          <ArrowRight className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-155 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent space-y-2 overflow-y-auto pr-1">
          {orders.map((order, index) => (
            <OrderRow key={order.id} order={order} t={t} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
