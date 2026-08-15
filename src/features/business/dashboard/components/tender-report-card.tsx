import { useCallback, useState } from "react"
import { Pie, PieChart, Cell, Sector, ResponsiveContainer, type PieSectorDataItem } from "recharts"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { TenderEntry } from "../mock/dashboard-data"

interface TenderReportCardProps {
  data: TenderEntry[]
  dateRange: string
  onPrint?: () => void
  onSave?: () => void
}

const renderActiveShape = (props: PieSectorDataItem & { isActive: boolean }, formatCurrency: (v: number) => string) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent, value, isActive } = props

  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * (midAngle ?? 1))
  const cos = Math.cos(-RADIAN * (midAngle ?? 1))
  const sx = (cx ?? 1) + ((outerRadius ?? 0) + 8) * cos
  const sy = (cy ?? 1) + ((outerRadius ?? 0) + 8) * sin
  const mx = (cx ?? 1) + ((outerRadius ?? 0) + 20) * cos
  const my = (cy ?? 1) + ((outerRadius ?? 0) + 20) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 15
  const ey = my
  const textAnchor = cos >= 0 ? "start" : "end"

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {isActive && (
        <>
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={(outerRadius ?? 0) + 6}
            outerRadius={(outerRadius ?? 0) + 10}
            fill={fill}
          />
          <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} strokeWidth={1.5} fill="none" />
          <circle cx={ex} cy={ey} r={2.5} fill={fill} stroke="none" />
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 10}
            y={ey - 2}
            textAnchor={textAnchor}
            className="fill-foreground text-xs font-medium"
          >
            {formatCurrency(value ?? 0)}
          </text>
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 10}
            y={ey + 14}
            textAnchor={textAnchor}
            className="fill-muted-foreground text-[10px]"
          >
            {`${((percent ?? 1) * 100).toFixed(1)}%`}
          </text>
        </>
      )}
    </g>
  )
}

export function TenderReportCard({ data, dateRange, onPrint, onSave }: TenderReportCardProps) {
  const { t } = useTranslation("business-dashboard")
  const { formatCurrency } = useLocaleFormat()
  const totalSales = data.reduce((sum, entry) => sum + entry.sales, 0)
  const totalQuantity = data.reduce((sum, entry) => sum + entry.quantity, 0)
  const [showDefaultActive, setShowDefaultActive] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const defaultActiveIndex = data.reduce((maxIdx, entry, idx) => (entry.sales > data[maxIdx].sales ? idx : maxIdx), 0)

  const shape = useCallback(
    (props: PieSectorDataItem & { isActive: boolean }, index: number) => {
      const isDefaultActive = showDefaultActive && hoveredIndex === null && index === defaultActiveIndex
      return renderActiveShape({ ...props, isActive: props.isActive || isDefaultActive }, formatCurrency)
    },
    [formatCurrency, defaultActiveIndex, showDefaultActive, hoveredIndex]
  )

  const handleAnimationEnd = useCallback(() => {
    setShowDefaultActive(true)
  }, [])

  const handlePieMouseEnter = useCallback((_: unknown, index: number) => {
    setHoveredIndex(index)
  }, [])

  const handlePieMouseLeave = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  return (
    <Card className="flex max-h-[640px] flex-col transition-all duration-300 hover:shadow-md">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{t("tender_report")}</CardTitle>
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
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
        <div className="relative h-[280px] w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="sales"
                nameKey="description"
                shape={shape}
                onAnimationEnd={handleAnimationEnd}
                onMouseEnter={handlePieMouseEnter}
                onMouseLeave={handlePieMouseLeave}
                paddingAngle={2}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-base font-semibold text-foreground">
              {data[defaultActiveIndex]?.description ?? ""}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {data.map((entry) => (
            <div key={entry.description} className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-medium text-muted-foreground">{entry.description}</span>
            </div>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid grid-cols-3 border-b px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">{t("description")}</span>
            <span className="text-right text-xs font-medium text-muted-foreground">{t("quantity")}</span>
            <span className="text-right text-xs font-medium text-muted-foreground">{t("sales")}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Table>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.description}>
                    <TableCell className="text-xs font-medium">{entry.description}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{entry.quantity}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{formatCurrency(entry.sales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-3 border-t-2 border-foreground/10 px-4 py-2 font-bold">
            <span className="text-xs">{t("total")}</span>
            <span className="text-right text-xs tabular-nums">{totalQuantity}</span>
            <span className="text-right text-xs tabular-nums">{formatCurrency(totalSales)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
