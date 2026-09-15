import { useState, useMemo, useCallback } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { VsPreviousMonthWeek } from "../mock/dashboard-data"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

interface VsPreviousMonthChartProps {
  weeks: VsPreviousMonthWeek[]
  currentMonthName: string
  previousMonthName: string
  previousMonthTotal: number
  currentMonthTotal: number
  onPrint?: () => void
  onSave?: () => void
  onMonthChange?: (month: string) => void
}

function makeChartConfig(): ChartConfig {
  return {
    previousMonth: {
      label: "Previous Month",
      color: CHART_SECONDARY,
    },
    currentMonth: {
      label: "Current Month",
      color: CHART_PRIMARY,
    },
  }
}

function CustomXAxisTick(props: Record<string, unknown>) {
  const x = Number(props.x)
  const y = Number(props.y)
  const payload = props.payload as { value: string } | undefined
  const weeks = props.weeks as VsPreviousMonthWeek[] | undefined
  const index = props.index as number | undefined

  if (!payload?.value || isNaN(x) || isNaN(y)) return null

  const weekData = weeks?.[index ?? 0]
  const sublabel = weekData?.sublabel

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
        {payload.value}
      </text>
      {sublabel && (
        <text x={0} y={0} dy={26} textAnchor="middle" className="fill-muted-foreground opacity-60" fontSize={9}>
          ({sublabel})
        </text>
      )}
    </g>
  )
}

export function VsPreviousMonthChart({
  weeks,
  currentMonthName,
  previousMonthName,
  previousMonthTotal,
  currentMonthTotal,
  onPrint,
  onSave,
  onMonthChange,
}: VsPreviousMonthChartProps) {
  const { t } = useTranslation("business-dashboard")
  const { locale, formatCurrency } = useLocaleFormat()
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName)
  const chartConfig = useMemo(() => makeChartConfig(), [])

  const formatMonthName = useCallback(
    (englishName: string): string => {
      const monthIndex = MONTHS_EN.indexOf(englishName)
      if (monthIndex === -1) return englishName
      return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2026, monthIndex, 1))
    },
    [locale]
  )

  const localizedMonths = useMemo(
    () => MONTHS_EN.map((m) => ({ en: m, localized: formatMonthName(m) })),
    [formatMonthName]
  )

  const handleMonthChange = (value: string) => {
    const en = localizedMonths.find((m) => m.localized === value)?.en ?? value
    setSelectedMonth(en)
    onMonthChange?.(en)
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t("vs_previous_month")}</CardTitle>
          <Select value={formatMonthName(selectedMonth)} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {localizedMonths.map((m) => (
                <SelectItem key={m.en} value={m.localized} className="text-xs">
                  {m.localized}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_SECONDARY }} />
              <span className="text-muted-foreground">{formatMonthName(previousMonthName)}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatCurrency(previousMonthTotal)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_PRIMARY }} />
              <span className="text-muted-foreground">{formatMonthName(currentMonthName)}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatCurrency(currentMonthTotal)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={onPrint} title={t("print")}>
              <Printer className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onSave} title={t("save")}>
              <Save className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            data={weeks}
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              tick={(props) => <CustomXAxisTick {...props} weeks={weeks} />}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              tickFormatter={(value: number) => {
                if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
                if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
                return `$${value}`
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar
              dataKey="previousMonth"
              fill={CHART_SECONDARY}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="currentMonth"
              fill={CHART_PRIMARY}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ChartContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("vs_previous_month_description")
            .replace("{{currentMonth}}", formatMonthName(currentMonthName))
            .replace("{{previousMonth}}", formatMonthName(previousMonthName))}
        </p>
      </CardContent>
    </Card>
  )
}
