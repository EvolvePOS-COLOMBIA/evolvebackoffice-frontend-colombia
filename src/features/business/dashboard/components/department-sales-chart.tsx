import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { DepartmentSale } from "../mock/dashboard-data"
import {
  CHART_PRIMARY,
  CHART_PRIMARY_LIGHT,
  CHART_PRIMARY_DARK,
  CHART_SECONDARY,
  CHART_SECONDARY_LIGHT,
  CHART_SECONDARY_DARK,
} from "../constants"

interface DepartmentSalesChartProps {
  data: DepartmentSale[]
  dateRange: string
  onPrint?: () => void
  onSave?: () => void
}

const chartConfig = {
  sales: { label: "Sales" },
  grocery: { label: "BEBIDAS", color: CHART_PRIMARY },
  soda: { label: "PLATOS", color: CHART_PRIMARY_DARK },
  tax: { label: "ACOMPAÑAMIENTOS", color: CHART_PRIMARY_LIGHT },
  hba: { label: "POSTRES", color: CHART_SECONDARY },
  tobacco: { label: "ALCOHOL", color: CHART_SECONDARY_DARK },
  sopa: { label: "PORCIONES", color: CHART_SECONDARY_LIGHT },
} satisfies ChartConfig

export function DepartmentSalesChart({ data, dateRange, onPrint, onSave }: DepartmentSalesChartProps) {
  const { t } = useTranslation("business-dashboard")
  const { formatCurrency } = useLocaleFormat()

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{t("department_sales")}</CardTitle>
            <CardDescription>{dateRange}</CardDescription>
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
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart data={data} margin={{ top: 10, right: -19, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="department" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
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
              active
              content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
            />
            <Bar
              dataKey="sales"
              radius={[4, 4, 0, 0]}
              barSize={40}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <rect key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
