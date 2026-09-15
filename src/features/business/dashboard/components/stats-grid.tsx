import { Card, CardContent } from "@/components/ui/card"
import { useCountUp } from "@/hooks/use-count-up"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { StatsData } from "../mock/dashboard-data"
import { DollarSign, Receipt, Wallet, Hash, CreditCard, Users, XCircle, Ban, Package, Globe } from "lucide-react"
import { CHART_PRIMARY, CHART_SECONDARY } from "../constants"

interface StatsGridProps {
  stats: StatsData
}

interface StatCardProps {
  label: string
  value: number
  style?: "currency" | "number"
  accent?: string
  decimals?: number
  compact?: boolean
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

function StatCard({ label, value, accent, decimals = 0, style = "currency", icon: Icon }: StatCardProps) {
  const { locale, formatCurrency, formatNumber } = useLocaleFormat()
  const display = useCountUp(value, {
    locale,
    decimals,
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
        <p className="text-lg font-bold tracking-tight text-foreground tabular-nums">{display}</p>
      </CardContent>
    </Card>
  )
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation("business-dashboard")

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("gross_sales")} value={stats.grossSales} accent={CHART_PRIMARY} icon={DollarSign} />
        <StatCard label={t("taxes")} value={stats.taxes} accent={CHART_SECONDARY} icon={Receipt} />
        <StatCard label={t("net_sales")} value={stats.netSales} accent={CHART_PRIMARY} icon={Wallet} />
        <StatCard label={t("hash")} value={stats.hash} accent={CHART_SECONDARY} icon={Hash} />
        <StatCard label={t("net_sales_wohash")} value={stats.netSalesWohash} accent={CHART_PRIMARY} icon={CreditCard} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("customers")} value={stats.customers} style="number" accent={CHART_SECONDARY} icon={Users} />
        <StatCard label={t("void_trans")} value={stats.voidTrans} accent={CHART_PRIMARY} icon={XCircle} />
        <StatCard label={t("cancel_trans")} value={stats.cancelTrans} accent={CHART_SECONDARY} icon={Ban} />
        <StatCard
          label={t("items_sold")}
          value={stats.itemsSold}
          style="number"
          accent={CHART_PRIMARY}
          icon={Package}
        />
        <StatCard label={t("web_sales")} value={stats.webSales} style="number" accent={CHART_SECONDARY} icon={Globe} />
      </div>
    </div>
  )
}
