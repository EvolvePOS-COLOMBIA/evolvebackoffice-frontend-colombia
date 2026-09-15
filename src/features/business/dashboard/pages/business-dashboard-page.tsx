import { useState, useCallback, useMemo } from "react"
import { Printer, Save, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import type { Period } from "../mock/dashboard-data"
import {
  useDashboardStats,
  useDepartmentSales,
  useTenderReport,
  useSalesByPeriod,
  useActiveOrders,
  useYearOnYear,
  useVsPreviousMonth,
} from "../hooks/use-dashboard"
import { PeriodFilter } from "../components/period-filter"
import { SalesByPeriodChart } from "../components/sales-by-period-chart"
import { ActiveOrdersCard } from "../components/active-orders-card"
import { StatsGrid } from "../components/stats-grid"
import { DepartmentSalesChart } from "../components/department-sales-chart"
import { TenderReportCard } from "../components/tender-report-card"
import { YearOnYearChart } from "../components/year-on-year-chart"
import { VsPreviousMonthChart } from "../components/vs-previous-month-chart"

function getDateRange(
  period: Period,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string
): string {
  const now = new Date()
  const day = now.getDate()
  const month = now.toLocaleString(locale, { month: "long" })
  const year = now.getFullYear()

  switch (period) {
    case "day":
      return t("today", { month, day, year })
    case "week": {
      const start = new Date(now)
      start.setDate(day - now.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      const startDay = start.getDate()
      const endDay = end.getDate()
      const endMonth = end.toLocaleString(locale, { month: "long" })
      return t("this_week", { month: endMonth, start: startDay, end: endDay })
    }
    case "month":
      return t("this_month", { month, year })
  }
}

export function BusinessDashboardPage() {
  const { t } = useTranslation("business-dashboard")
  const { locale } = useLocaleFormat()
  const [period, setPeriod] = useState<Period>("week")
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  const { data: stats } = useDashboardStats(period)
  const { data: departmentSales } = useDepartmentSales(period)
  const { data: tenderReport } = useTenderReport(period)
  const { data: salesByPeriod } = useSalesByPeriod(period)
  const { data: activeOrders } = useActiveOrders()
  const { data: yearOnYear } = useYearOnYear()
  const { data: vsPreviousMonth } = useVsPreviousMonth()

  const showAlert = useCallback((message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }, [])

  const handlePrint = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])
  const handleSave = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])
  const handleSettings = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])

  const dateRange = getDateRange(period, t, locale)

  const salesByPeriodData = useMemo(() => {
    const map = { day: "hourly", week: "weekly", month: "monthly" } as const
    const points = salesByPeriod?.[map[period]] ?? []
    return {
      points,
      totalSales: points.reduce((sum, p) => sum + p.sales, 0),
      totalTransactions: points.reduce((sum, p) => sum + p.transactions, 0),
    }
  }, [period, salesByPeriod])

  const defaultStats = useMemo(
    () => ({
      grossSales: 0,
      taxes: 0,
      netSales: 0,
      hash: 0,
      negHash: 0,
      netSalesWohash: 0,
      customers: 0,
      voidTrans: 0,
      cancelTrans: 0,
      itemsSold: 0,
      webSales: 0,
    }),
    []
  )

  return (
    <div>
      <div className="dashboard grid grid-cols-1 gap-4 lg:grid-cols-[1fr_440px]">
        {/* ═══════════════════════════════════════════
            LEFT COLUMN: Period filter → Stats → Dept Sales → Year-on-year
           ═══════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Period filter + action buttons */}
          <div className="flex items-center gap-3">
            <PeriodFilter value={period} onChange={setPeriod} />
            <div className="ml-auto flex gap-3">
              <Button variant="outline" size="icon" onClick={handlePrint} title={t("print")}>
                <Printer className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSave} title={t("save")}>
                <Save className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSettings} title={t("settings")}>
                <Settings className="size-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-6">
            <StatsGrid stats={stats ?? defaultStats} />
            <SalesByPeriodChart
              data={salesByPeriodData.points}
              period={period}
              totalSales={salesByPeriodData.totalSales}
              totalTransactions={salesByPeriodData.totalTransactions}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>

          {/* Department Sales */}
          <div>
            <DepartmentSalesChart
              data={(departmentSales ?? []).map((d) => ({ ...d, fill: "" }))}
              dateRange={dateRange}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>

          {/* Year-on-year */}
          <div>
            <YearOnYearChart
              data={yearOnYear?.months ?? []}
              total2025={yearOnYear?.total2025 ?? 0}
              total2026={yearOnYear?.total2026 ?? 0}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT COLUMN: Tender Report → Vs. Previous Month
           ═══════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Active Orders */}
          <div>
            <ActiveOrdersCard
              orders={(activeOrders ?? []).map((o) => ({
                ...o,
                status: o.status as "pending" | "preparing" | "ready" | "on_the_way" | "delivered",
              }))}
            />
          </div>

          {/* Tender Report */}
          <div>
            <TenderReportCard
              data={(tenderReport ?? []).map((t) => ({ ...t, color: "" }))}
              dateRange={dateRange}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>

          {/* Vs. Previous Month */}
          <div>
            <VsPreviousMonthChart
              weeks={vsPreviousMonth?.weeks ?? []}
              currentMonthName={vsPreviousMonth?.currentMonthName ?? ""}
              previousMonthName={vsPreviousMonth?.previousMonthName ?? ""}
              previousMonthTotal={vsPreviousMonth?.previousMonthTotal ?? 0}
              currentMonthTotal={vsPreviousMonth?.currentMonthTotal ?? 0}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("attention")}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>{t("understood")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
