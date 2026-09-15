import { useMemo } from "react"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { Period, SalesByPeriodPoint } from "../mock/dashboard-data"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"

interface SalesByPeriodChartProps {
  data: SalesByPeriodPoint[]
  period: Period
  totalSales: number
  totalTransactions: number
  onPrint?: () => void
  onSave?: () => void
}

const chartConfig = {
  sales: { label: "Sales", color: CHART_PRIMARY },
  transactions: { label: "Transactions", color: CHART_SECONDARY },
} satisfies ChartConfig

/** Full localized day names by locale */
const DAY_NAMES: Record<string, string[]> = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
}

/** Abbreviated month names by locale */
const MONTH_NAMES: Record<string, string[]> = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
}

/** Map abbreviated day labels to day-of-week index (0=Sun) */
const DAY_INDEX: Record<string, number> = {
  Lun: 1,
  Mar: 2,
  Mié: 3,
  Jue: 4,
  Vie: 5,
  Sáb: 6,
  Dom: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 0,
}

function formatMonthDay(dayNum: number, locale: string): string {
  const now = new Date()
  const months = MONTH_NAMES[locale] ?? MONTH_NAMES.en
  return `${months[now.getMonth()]} ${dayNum}`
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
      <p className="mb-1.5 font-medium capitalize">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_PRIMARY }} />
          <span className="text-muted-foreground">{t("sales")}:</span>
          <span className="font-mono font-medium tabular-nums">{formatCurrency(point?.sales ?? 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_SECONDARY }} />
          <span className="text-muted-foreground">{t("quantity")}:</span>
          <span className="font-mono font-medium tabular-nums">{point?.transactions ?? 0}</span>
        </div>
      </div>
    </div>
  )
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
  const { formatCurrency, formatCurrencyCompact, locale: appLocale } = useLocaleFormat()
  const locale = appLocale.startsWith("es") ? "es" : "en"

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

  const localizedData = useMemo(() => {
    return data.map((point) => {
      if (period === "week") {
        const dayIndex = DAY_INDEX[point.label]
        const days = DAY_NAMES[locale] ?? DAY_NAMES.en
        return { ...point, label: days[dayIndex] ?? point.label }
      }
      if (period === "month") {
        const dayNum = parseInt(point.label, 10)
        if (!isNaN(dayNum)) return { ...point, label: formatMonthDay(dayNum, locale) }
      }
      return point
    })
  }, [data, period, locale])

  const maxTransactions = useMemo(() => Math.max(...localizedData.map((d) => d.transactions)), [localizedData])

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
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PRIMARY }} />
            <span className="text-muted-foreground">{t("total_sales")}:</span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(totalSales)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_SECONDARY }} />
            <span className="text-muted-foreground">{t("total_transactions")}:</span>
            <span className="font-mono font-medium tabular-nums">{totalTransactions}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <AreaChart data={localizedData} margin={{ top: 10, right: -19, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.9} />
                <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradientQty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.9} />
                <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              angle={period === "month" ? -45 : 0}
              textAnchor={period === "month" ? "end" : "middle"}
              height={period === "month" ? 50 : undefined}
              interval={0}
            />
            <YAxis
              yAxisId="sales"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
            />
            <YAxis
              yAxisId="qty"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              domain={[0, maxTransactions + 2]}
            />
            <Tooltip active content={<CustomTooltip formatCurrency={formatCurrency} t={t} />} />
            <Area
              yAxisId="sales"
              type="monotone"
              dataKey="sales"
              stroke={CHART_SECONDARY}
              fill="url(#gradientSales)"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              yAxisId="qty"
              type="monotone"
              dataKey="transactions"
              stroke={CHART_PRIMARY}
              fill="url(#gradientQty)"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
