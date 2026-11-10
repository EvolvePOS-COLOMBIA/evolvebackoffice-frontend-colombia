import { Card, CardContent } from "@/components/ui/card"
import { useCountUp } from "@/hooks/use-count-up"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { StatsData } from "../mock/dashboard-data"
import { DollarSign, Users, XCircle, Ban, Package, Globe, Truck, Undo2, HandCoins, Banknote } from "lucide-react"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"

interface StatsGridProps {
  stats: StatsData
}

type StatIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

interface BreakdownRow {
  label: string
  value: number
}

interface StatCardProps {
  label: string
  value: number
  style?: "currency" | "number"
  accent?: string
  icon: StatIcon
  /** Filas secundarias bajo el valor principal (p. ej. "Sin impuestos" / "Impuestos"). */
  breakdown?: BreakdownRow[]
}

function StatCard({ label, value, accent, style = "currency", icon: Icon, breakdown }: StatCardProps) {
  const { locale, formatCurrency, formatNumber } = useLocaleFormat()
  const display = useCountUp(value, {
    locale,
    decimals: 0,
    formatter: style === "currency" ? formatCurrency : formatNumber,
  })

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/10">
      {accent && (
        <div
          className="absolute inset-y-0 left-0 w-1 rounded-l-lg transition-all duration-300 group-hover:w-1.5"
          style={{ backgroundColor: accent }}
        />
      )}
      <CardContent className="p-3 pl-4 sm:p-4 sm:pl-5">
        <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
          <div
            className="flex size-6 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 sm:size-7"
            style={{ backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)` }}
          >
            <Icon className="size-3.5 sm:size-4" style={{ color: accent }} />
          </div>
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        </div>
        <p className="text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-xl">{display}</p>

        {breakdown && breakdown.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
            {breakdown.map((row) => (
              <BreakdownLine key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BreakdownLine({ label, value }: BreakdownRow) {
  const { formatCurrency } = useLocaleFormat()

  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px]">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 font-semibold text-foreground tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation("business-dashboard")

  // Impuesto total recaudado en el periodo (POS + órdenes web + manuales).
  const totalTaxes = stats.taxes + stats.webOrderTax + stats.manualOrderTax

  return (
    <div className="space-y-2">
      {/* Orígenes de ventas: cada card muestra el total (con impuestos) y su
          desglose "sin impuestos / impuestos". POS + Web + Manuales = Total. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("gross_sales")}
          value={stats.grossSales}
          accent={CHART_PRIMARY}
          icon={DollarSign}
          breakdown={[
            { label: t("without_tax"), value: stats.netSales },
            { label: t("taxes"), value: stats.taxes },
          ]}
        />
        <StatCard
          label={t("web_sales")}
          value={stats.webOrderSales}
          accent={CHART_SECONDARY}
          icon={Globe}
          breakdown={[
            { label: t("without_tax"), value: stats.webOrderSales - stats.webOrderTax },
            { label: t("taxes"), value: stats.webOrderTax },
          ]}
        />
        <StatCard
          label={t("manual_sales")}
          value={stats.manualOrderSales}
          accent={CHART_PRIMARY}
          icon={HandCoins}
          breakdown={[
            { label: t("without_tax"), value: stats.manualOrderSales - stats.manualOrderTax },
            { label: t("taxes"), value: stats.manualOrderTax },
          ]}
        />
        <StatCard
          label={t("sales_total")}
          value={stats.totalSales}
          accent={CHART_SECONDARY}
          icon={Banknote}
          breakdown={[
            { label: t("without_tax"), value: stats.totalSales - totalTaxes },
            { label: t("taxes"), value: totalTaxes },
          ]}
        />
      </div>

      {/* Métricas del periodo:6 cards que reparten exactas en2/3/6 columnas
          (sin huecos en ningún breakpoint). */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("customers")} value={stats.customers} style="number" accent={CHART_SECONDARY} icon={Users} />
        <StatCard label={t("voided_amount")} value={stats.voidedAmount} accent={CHART_PRIMARY} icon={XCircle} />
        <StatCard
          label={t("void_count")}
          value={stats.voidCount}
          style="number"
          accent={CHART_SECONDARY}
          icon={Undo2}
        />
        {/* Trans. Canceladas: cantidad de ventas de caja canceladas en el
            periodo (antes se mostraba el monto con formato de moneda). */}
        <StatCard
          label={t("cancel_trans")}
          value={stats.cancelTransCount}
          style="number"
          accent={CHART_PRIMARY}
          icon={Ban}
        />
        <StatCard
          label={t("items_sold")}
          value={stats.itemsSold}
          style="number"
          accent={CHART_SECONDARY}
          icon={Package}
        />
        {/* Domicilios cobrados: dinero recibido que NO se contabiliza como
            venta (regla contable — el informe de cierre sumará ventas +
            domicilios). */}
        <StatCard label={t("shipping_collected")} value={stats.shippingCollected} accent={CHART_PRIMARY} icon={Truck} />
      </div>
    </div>
  )
}
