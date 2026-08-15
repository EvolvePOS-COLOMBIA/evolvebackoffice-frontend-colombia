export type Period = "day" | "week" | "month"

export interface StatsData {
  grossSales: number
  taxes: number
  netSales: number
  hash: number
  negHash: number
  netSalesWohash: number
  customers: number
  voidTrans: number
  cancelTrans: number
  itemsSold: number
  webSales: number
}

export interface DepartmentSale {
  department: string
  sales: number
  fill: string
}

export interface TenderEntry {
  description: string
  quantity: number
  sales: number
  color: string
}

export interface YearOnYearMonth {
  month: string
  year2025: number
  year2026: number
}

export interface VsPreviousMonthWeek {
  label: string
  sublabel: string
  previousMonth: number
  currentMonth: number
}

export interface DashboardData {
  stats: Record<Period, StatsData>
  departmentSales: Record<Period, DepartmentSale[]>
  tenderReport: Record<Period, TenderEntry[]>
  yearOnYear: {
    total2025: number
    total2026: number
    months: YearOnYearMonth[]
  }
  vsPreviousMonth: {
    currentMonthName: string
    previousMonthName: string
    previousMonthTotal: number
    currentMonthTotal: number
    weeks: VsPreviousMonthWeek[]
    description: string
  }
}

export const dashboardData: DashboardData = {
  stats: {
    day: {
      grossSales: 49.51,
      taxes: 2.69,
      netSales: 46.82,
      hash: 0.0,
      negHash: 0.0,
      netSalesWohash: 0.0,
      customers: 8,
      voidTrans: 0.0,
      cancelTrans: 0.0,
      itemsSold: 15,
      webSales: 3,
    },
    week: {
      grossSales: 342.87,
      taxes: 18.52,
      netSales: 324.35,
      hash: 5.2,
      negHash: 1.8,
      netSalesWohash: 319.15,
      customers: 56,
      voidTrans: 12.5,
      cancelTrans: 8.75,
      itemsSold: 108,
      webSales: 22,
    },
    month: {
      grossSales: 1428.63,
      taxes: 77.15,
      netSales: 1351.48,
      hash: 18.4,
      negHash: 6.2,
      netSalesWohash: 1333.08,
      customers: 234,
      voidTrans: 45.0,
      cancelTrans: 22.5,
      itemsSold: 467,
      webSales: 95,
    },
  },

  departmentSales: {
    day: [
      { department: "GROCERY", sales: 8, fill: "var(--color-grocery)" },
      { department: "SODA CRV", sales: 1, fill: "var(--color-soda)" },
      { department: "TAX GROCERY", sales: 4, fill: "var(--color-tax)" },
      { department: "HBA", sales: 12, fill: "var(--color-hba)" },
      { department: "TOBACCO", sales: 2, fill: "var(--color-tobacco)" },
      { department: "SOPA", sales: 6, fill: "var(--color-sopa)" },
    ],
    week: [
      { department: "GROCERY", sales: 12, fill: "var(--color-grocery)" },
      { department: "SODA CRV", sales: 3, fill: "var(--color-soda)" },
      { department: "TAX GROCERY", sales: 7, fill: "var(--color-tax)" },
      { department: "HBA", sales: 20, fill: "var(--color-hba)" },
      { department: "TOBACCO", sales: 4, fill: "var(--color-tobacco)" },
      { department: "SOPA", sales: 9, fill: "var(--color-sopa)" },
    ],
    month: [
      { department: "GROCERY", sales: 45, fill: "var(--color-grocery)" },
      { department: "SODA CRV", sales: 12, fill: "var(--color-soda)" },
      { department: "TAX GROCERY", sales: 28, fill: "var(--color-tax)" },
      { department: "HBA", sales: 65, fill: "var(--color-hba)" },
      { department: "TOBACCO", sales: 18, fill: "var(--color-tobacco)" },
      { department: "SOPA", sales: 35, fill: "var(--color-sopa)" },
    ],
  },

  tenderReport: {
    day: [
      { description: "Cash", quantity: 4, sales: 37.34, color: "#3b82f6" },
      { description: "Store", quantity: 1, sales: 12.17, color: "#f59e0b" },
      { description: "Credit", quantity: 2, sales: 28.50, color: "#10b981" },
    ],
    week: [
      { description: "Cash", quantity: 18, sales: 187.34, color: "#3b82f6" },
      { description: "Store", quantity: 5, sales: 62.17, color: "#f59e0b" },
      { description: "Credit", quantity: 12, sales: 156.80, color: "#10b981" },
      { description: "Debit", quantity: 8, sales: 94.25, color: "#8b5cf6" },
    ],
    month: [
      { description: "Cash", quantity: 78, sales: 807.34, color: "#3b82f6" },
      { description: "Store", quantity: 22, sales: 262.17, color: "#f59e0b" },
      { description: "Credit", quantity: 45, sales: 523.90, color: "#10b981" },
      { description: "Debit", quantity: 32, sales: 387.60, color: "#8b5cf6" },
      { description: "Gift Card", quantity: 8, sales: 95.00, color: "#ec4899" },
      { description: "EBT", quantity: 15, sales: 178.45, color: "#06b6d4" },
    ],
  },

  yearOnYear: {
    total2025: 5_174_511.53,
    total2026: 1_892_998.28,
    months: [
      { month: "January", year2025: 420_000, year2026: 310_000 },
      { month: "February", year2025: 380_000, year2026: 290_000 },
      { month: "March", year2025: 450_000, year2026: 340_000 },
      { month: "April", year2025: 520_000, year2026: 180_000 },
      { month: "May", year2025: 480_000, year2026: 120_000 },
      { month: "June", year2025: 460_000, year2026: 95_000 },
      { month: "July", year2025: 510_000, year2026: 85_000 },
      { month: "August", year2025: 490_000, year2026: 78_000 },
      { month: "September", year2025: 440_000, year2026: 0 },
      { month: "October", year2025: 470_000, year2026: 0 },
      { month: "November", year2025: 500_000, year2026: 0 },
      { month: "December", year2025: 574_511.53, year2026: 0 },
    ],
  },

  vsPreviousMonth: {
    currentMonthName: "August",
    previousMonthName: "July",
    previousMonthTotal: 816.18,
    currentMonthTotal: 742.65,
    weeks: [
      { label: "Week 1", sublabel: "Day 01–07", previousMonth: 180.5, currentMonth: 165.3 },
      { label: "Week 2", sublabel: "Day 08–14", previousMonth: 220.3, currentMonth: 198.75 },
      { label: "Week 3", sublabel: "Day 15–21", previousMonth: 215.88, currentMonth: 210.2 },
      { label: "Week 4", sublabel: "Day 22–31", previousMonth: 199.5, currentMonth: 168.4 },
    ],
    description:
      "The chart compares {{currentMonth}} (2026) with {{previousMonth}} (2026), divided by weeks.",
  },
}

export const periodLabels: Record<Period, { day: string; week: string; month: string }> = {
  day: {
    day: "Today",
    week: "This week",
    month: "This month",
  },
  week: {
    day: "This week",
    week: "This week",
    month: "This month",
  },
  month: {
    day: "This month",
    week: "This month",
    month: "This month",
  },
}
