import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"
import type { Period } from "../mock/dashboard-data"

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const { t } = useTranslation("business-dashboard")
  const periods: Period[] = ["day", "week", "month"]

  const labels: Record<Period, string> = {
    day: t("day"),
    week: t("week"),
    month: t("month"),
  }

  return (
    <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
            "hover:bg-background/80",
            value === period ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {labels[period]}
        </button>
      ))}
    </div>
  )
}
