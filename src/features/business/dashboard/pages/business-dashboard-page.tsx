import { useState, useCallback } from "react"
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
import { dashboardData, type Period } from "../mock/dashboard-data"
import { PeriodFilter } from "../components/period-filter"
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

  const showAlert = useCallback((message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }, [])

  const handlePrint = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])
  const handleSave = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])
  const handleSettings = useCallback(() => showAlert(t("not_implemented")), [showAlert, t])

  const dateRange = getDateRange(period, t, locale)

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
          <div>
            <StatsGrid stats={dashboardData.stats[period]} />
          </div>

          {/* Department Sales */}
          <div>
            <DepartmentSalesChart
              data={dashboardData.departmentSales[period]}
              dateRange={dateRange}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>

          {/* Year-on-year */}
          <div>
            <YearOnYearChart
              data={dashboardData.yearOnYear.months}
              total2025={dashboardData.yearOnYear.total2025}
              total2026={dashboardData.yearOnYear.total2026}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT COLUMN: Tender Report → Vs. Previous Month
           ═══════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Tender Report */}
          <div>
            <TenderReportCard
              data={dashboardData.tenderReport[period]}
              dateRange={dateRange}
              onPrint={handlePrint}
              onSave={handleSave}
            />
          </div>

          {/* Vs. Previous Month */}
          <div>
            <VsPreviousMonthChart
              weeks={dashboardData.vsPreviousMonth.weeks}
              currentMonthName={dashboardData.vsPreviousMonth.currentMonthName}
              previousMonthName={dashboardData.vsPreviousMonth.previousMonthName}
              previousMonthTotal={dashboardData.vsPreviousMonth.previousMonthTotal}
              currentMonthTotal={dashboardData.vsPreviousMonth.currentMonthTotal}
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
