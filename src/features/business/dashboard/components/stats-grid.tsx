import { Card, CardContent } from "@/components/ui/card"
import { useCountUp } from "@/hooks/use-count-up"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import type { StatsData } from "../mock/dashboard-data"
import { DollarSign, Receipt, Wallet, Hash, CreditCard, Users, XCircle, Ban, Package, Globe } from "lucide-react"

interface StatsGridProps {
  stats: StatsData
}

interface StatCardProps {
  label: string
  value: number
  accent?: string
  decimals?: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

function StatCard({ label, value, accent, decimals = 0, icon: Icon }: StatCardProps) {
  const { locale, formatCurrency } = useLocaleFormat()
  const display = useCountUp(value, {
    decimals,
    locale,
    formatter: decimals > 0 ? formatCurrency : undefined,
  })

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/10">
      {accent && (
        <div
          className="absolute inset-y-0 left-0 w-1 rounded-l-lg transition-all duration-300 group-hover:w-1.5"
          style={{ backgroundColor: accent }}
        />
      )}
      <CardContent className="p-4 pl-5">
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)` }}
          >
            <Icon className="size-4" style={{ color: accent }} />
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{display}</p>
      </CardContent>
    </Card>
  )
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation("business-dashboard")

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("gross_sales")}
          value={stats.grossSales}
          decimals={2}
          accent="#22c55e"
          icon={DollarSign}
        />
        <StatCard label={t("taxes")} value={stats.taxes} decimals={2} accent="#f59e0b" icon={Receipt} />
        <StatCard
          label={t("net_sales")}
          value={stats.netSales}
          decimals={2}
          accent="#3b82f6"
          icon={Wallet}
        />
        <StatCard label={t("hash")} value={stats.hash} decimals={2} accent="#8b5cf6" icon={Hash} />
        <StatCard
          label={t("net_sales_wohash")}
          value={stats.netSalesWohash}
          decimals={2}
          accent="#06b6d4"
          icon={CreditCard}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("customers")} value={stats.customers} accent="#22c55e" icon={Users} />
        <StatCard
          label={t("void_trans")}
          value={stats.voidTrans}
          decimals={2}
          accent="#ef4444"
          icon={XCircle}
        />
        <StatCard
          label={t("cancel_trans")}
          value={stats.cancelTrans}
          decimals={2}
          accent="#f97316"
          icon={Ban}
        />
        <StatCard label={t("items_sold")} value={stats.itemsSold} accent="#8b5cf6" icon={Package} />
        <StatCard label={t("web_sales")} value={stats.webSales} accent="#06b6d4" icon={Globe} />
      </div>
    </div>
  )
}
