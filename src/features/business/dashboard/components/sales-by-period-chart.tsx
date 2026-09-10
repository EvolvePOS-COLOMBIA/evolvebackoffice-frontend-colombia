import { useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { Period, SalesByPeriodPoint } from "../mock/dashboard-data"

interface SalesByPeriodChartProps {
  data: SalesByPeriodPoint[]
  period: Period
  totalSales: number
  totalTransactions: number
  onPrint?: () => void
  onSave?: () => void
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "#10b981",
  },
} satisfies ChartConfig

/** Emerald palette for bar gradient — varies by peak intensity */
const BAR_COLORS = [
  "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857",
  "#059669", "#10b981", "#34d399", "#6ee7b7", "#34d399",
  "#10b981", "#059669",
]

function getBarColor(index: number, total: number, sales: number, maxSales: number): string {
  const intensity = maxSales > 0 ? sales / maxSales : 0
  // Map intensity to emerald palette: low = lighter, high = deeper
  const palette = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857"]
  const colorIndex = Math.min(Math.floor(intensity * palette.length), palette.length - 1)
  return palette[colorIndex]
}

function CustomTooltip({
  active,
  payload,
  label,
  formatCurrency,
  t,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: SalesByPeriodPoint }>
  label?: string
  formatCurrency: (value: number) => string
  t: (key: string) => string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">{t("sales")}:</span>
        <span className="font-mono font-medium tabular-nums">
          {formatCurrency(point?.sales ?? 0)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="text-muted-foreground">{t("quantity")}:</span>
        <span className="font-mono font-medium tabular-nums">
          {point?.transactions ?? 0}
        </span>
      </div>
    </div>
  )
}

function formatTick(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  if (value >= 100) return `$${value.toFixed(0)}`
  return `$${value.toFixed(0)}`
}

export function SalesByPeriodChart({
  data,
  period,
  totalSales,
  totalTransactions,
  onPrint,
  onSave,
}: SalesByPeriodChartProps) {
  const { t } = useTranslation("business-dashboard")
  const { formatCurrency } = useLocaleFormat()

  const maxSales = useMemo(() => Math.max(...data.map((d) => d.sales), 1), [data])

  const periodTitle = useMemo(() => {
    switch (period) {
      case "day":
        return t("sales_by_hour")
      case "week":
        return t("sales_by_day")
      case "month":
        return t("sales_by_date")
    }
  }, [period, t])

  const description = useMemo(() => {
    switch (period) {
      case "day":
        return t("sales_by_hour_description")
      case "week":
        return t("sales_by_day_description")
      case "month":
        return t("sales_by_date_description")
    }
  }, [period, t])

  const gradientId = "gradientSalesByPeriod"

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{periodTitle}</CardTitle>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={onPrint} title={t("print")}>
              <Printer className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onSave} title={t("save")}>
              <Save className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{t("total_sales")}:</span>
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(totalSales)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="text-muted-foreground">{t("total_transactions")}:</span>
            <span className="font-mono font-medium tabular-nums">
              {totalTransactions}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              tickFormatter={(value: string) => {
                // For monthly, show only every 5th date to avoid crowding
                if (period === "month") {
                  const num = parseInt(value, 10)
                  if (num % 5 === 0 || num === 1) return value
                  return ""
                }
                return value
              }}
              interval={period === "month" ? 0 : 0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              tickFormatter={formatTick}
            />
            <Tooltip
              content={<CustomTooltip formatCurrency={formatCurrency} t={t} />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar
              dataKey="sales"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${gradientId})`}
                  stroke={getBarColor(index, data.length, entry.sales, maxSales)}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <p
          className="mt-2 text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </CardContent>
    </Card>
  )
}
