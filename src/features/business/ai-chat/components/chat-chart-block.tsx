import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useLocaleFormat } from "@/hooks/use-locale-format"
import { cn } from "@/lib/utils"
import type { ChartSpec } from "../types"

const SERIES_COLORS = ["#2563eb", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"]

interface ChatChartBlockProps {
  chart: ChartSpec
  className?: string
}

/**
 * Renderiza la especificación de gráfica (ChartSpec) devuelva por el
 * asistente de IA usando Recharts, con el mismo estilo que el dashboard.
 */
export function ChatChartBlock({ chart, className }: ChatChartBlockProps) {
  const { formatCurrencyCompact } = useLocaleFormat()

  if (!chart.labels?.length || !chart.series?.length) return null

  const data = chart.labels.map((label, index) => {
    const row: Record<string, string | number> = { label }
    for (const series of chart.series) {
      row[series.name] = series.data[index] ?? 0
    }
    return row
  })

  const isPie = chart.type === "pie"

  return (
    <div className={cn("rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm", className)}>
      {chart.title ? <p className="mb-2 text-xs font-semibold text-foreground">{chart.title}</p> : null}

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isPie ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.series[0].name}
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.label}`}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
              <Legend />
            </PieChart>
          ) : chart.type === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval={0}
                angle={data.length > 6 ? -30 : 0}
                textAnchor={data.length > 6 ? "end" : "middle"}
                height={data.length > 6 ? 44 : undefined}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tickFormatter={(v: number) => formatCurrencyCompact(v)}
              />
              <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
              <Legend />
              {chart.series.map((series, index) => (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval={0}
                angle={data.length > 6 ? -30 : 0}
                textAnchor={data.length > 6 ? "end" : "middle"}
                height={data.length > 6 ? 44 : undefined}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tickFormatter={(v: number) => formatCurrencyCompact(v)}
              />
              <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
              <Legend />
              {chart.series.map((series, index) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
