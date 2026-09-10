import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { YearOnYearMonth } from "../mock/dashboard-data"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"

interface YearOnYearChartProps {
  data: YearOnYearMonth[]
  total2025: number
  total2026: number
  onPrint?: () => void
  onSave?: () => void
}

const chartConfig = {
  year2025: { label: "2025", color: CHART_SECONDARY },
  year2026: { label: "2026", color: CHART_PRIMARY },
} satisfies ChartConfig

function CustomTooltip({
  active,
  payload,
  label,
  formatCurrency,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatCurrency: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function YearOnYearChart({ data, total2025, total2026, onPrint, onSave }: YearOnYearChartProps) {
  const { t } = useTranslation("business-dashboard")
  const { formatCurrency } = useLocaleFormat()

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{t("year_on_year")}</CardTitle>
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
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_SECONDARY }} />
            <span className="text-muted-foreground">2025</span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(total2025)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PRIMARY }} />
            <span className="text-muted-foreground">2026</span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(total2026)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradient2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.9} />
                <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradient2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.99} />
                <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`)}
            />
            <Tooltip active content={<CustomTooltip formatCurrency={formatCurrency} />} />
            <Area
              type="monotone"
              dataKey="year2025"
              stroke={CHART_SECONDARY}
              fill="url(#gradient2025)"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="year2026"
              stroke={CHART_PRIMARY}
              fill="url(#gradient2026)"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
        <p
          className="mt-2 text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: t("year_on_year_description") }}
        />
      </CardContent>
    </Card>
  )
}
