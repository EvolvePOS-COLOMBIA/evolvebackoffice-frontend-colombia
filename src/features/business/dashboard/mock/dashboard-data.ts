import {
  CHART_PRIMARY,
  CHART_PRIMARY_LIGHT,
  CHART_PRIMARY_DARK,
  CHART_SECONDARY,
  CHART_SECONDARY_LIGHT,
  CHART_SECONDARY_DARK,
} from "../constants"

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

export interface SalesByPeriodPoint {
  label: string
  sales: number
  transactions: number
}

export interface SalesByPeriodData {
  hourly: SalesByPeriodPoint[]
  weekly: SalesByPeriodPoint[]
  monthly: SalesByPeriodPoint[]
}

export type OrderStatus = "pending" | "preparing" | "ready" | "on_the_way" | "delivered"

export interface ActiveOrder {
  id: string
  customerName: string
  phone: string
  items: string[]
  itemCount: number
  total: number
  createdAt: string
  estimatedDelivery: string
  status: OrderStatus
  /** 0–100 progress based on status */
  progress: number
  address: string
  paymentMethod: string
  notes?: string
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
  salesByPeriod: SalesByPeriodData
  activeOrders: ActiveOrder[]
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
      grossSales: 2_580_000,
      taxes: 139_320,
      netSales: 2_440_680,
      hash: 0,
      negHash: 0,
      netSalesWohash: 0,
      customers: 87,
      voidTrans: 0,
      cancelTrans: 0,
      itemsSold: 156,
      webSales: 34,
    },
    week: {
      grossSales: 18_450_000,
      taxes: 996_300,
      netSales: 17_453_700,
      hash: 52_000,
      negHash: 18_000,
      netSalesWohash: 17_401_700,
      customers: 612,
      voidTrans: 125_000,
      cancelTrans: 87_500,
      itemsSold: 1_080,
      webSales: 220,
    },
    month: {
      grossSales: 78_500_000,
      taxes: 4_239_000,
      netSales: 74_261_000,
      hash: 184_000,
      negHash: 62_000,
      netSalesWohash: 74_077_000,
      customers: 2_540,
      voidTrans: 450_000,
      cancelTrans: 225_000,
      itemsSold: 4_670,
      webSales: 950,
    },
  },

  departmentSales: {
    day: [
      { department: "BEBIDAS", sales: 420_000, fill: CHART_PRIMARY },
      { department: "PLATOS", sales: 890_000, fill: CHART_PRIMARY_DARK },
      { department: "ACOMPAÑAMIENTOS", sales: 310_000, fill: CHART_PRIMARY_LIGHT },
      { department: "POSTRES", sales: 185_000, fill: CHART_SECONDARY },
      { department: "ALCOHOL", sales: 520_000, fill: CHART_SECONDARY_DARK },
      { department: "PORCIONES", sales: 255_000, fill: CHART_SECONDARY_LIGHT },
    ],
    week: [
      { department: "BEBIDAS", sales: 3_050_000, fill: CHART_PRIMARY },
      { department: "PLATOS", sales: 6_420_000, fill: CHART_PRIMARY_DARK },
      { department: "ACOMPAÑAMIENTOS", sales: 2_240_000, fill: CHART_PRIMARY_LIGHT },
      { department: "POSTRES", sales: 1_340_000, fill: CHART_SECONDARY },
      { department: "ALCOHOL", sales: 3_750_000, fill: CHART_SECONDARY_DARK },
      { department: "PORCIONES", sales: 1_650_000, fill: CHART_SECONDARY_LIGHT },
    ],
    month: [
      { department: "BEBIDAS", sales: 13_200_000, fill: CHART_PRIMARY },
      { department: "PLATOS", sales: 27_800_000, fill: CHART_PRIMARY_DARK },
      { department: "ACOMPAÑAMIENTOS", sales: 9_650_000, fill: CHART_PRIMARY_LIGHT },
      { department: "POSTRES", sales: 5_800_000, fill: CHART_SECONDARY },
      { department: "ALCOHOL", sales: 16_200_000, fill: CHART_SECONDARY_DARK },
      { department: "PORCIONES", sales: 5_850_000, fill: CHART_SECONDARY_LIGHT },
    ],
  },

  tenderReport: {
    day: [
      { description: "Efectivo", quantity: 34, sales: 1_050_000, color: CHART_PRIMARY },
      { description: "Nequi", quantity: 18, sales: 620_000, color: CHART_SECONDARY },
      { description: "Daviplata", quantity: 12, sales: 480_000, color: CHART_PRIMARY_LIGHT },
      { description: "Tarjeta Crédito", quantity: 15, sales: 430_000, color: CHART_SECONDARY_DARK },
    ],
    week: [
      { description: "Efectivo", quantity: 245, sales: 7_600_000, color: CHART_PRIMARY },
      { description: "Nequi", quantity: 128, sales: 4_200_000, color: CHART_SECONDARY },
      { description: "Daviplata", quantity: 86, sales: 2_850_000, color: CHART_PRIMARY_LIGHT },
      { description: "Tarjeta Crédito", quantity: 98, sales: 3_800_000, color: CHART_SECONDARY_DARK },
    ],
    month: [
      { description: "Efectivo", quantity: 1_050, sales: 32_500_000, color: CHART_PRIMARY },
      { description: "Nequi", quantity: 545, sales: 17_800_000, color: CHART_SECONDARY },
      { description: "Daviplata", quantity: 370, sales: 12_200_000, color: CHART_PRIMARY_LIGHT },
      { description: "Tarjeta Crédito", quantity: 420, sales: 16_000_000, color: CHART_SECONDARY_DARK },
    ],
  },

  salesByPeriod: {
    hourly: [
      { label: "6 AM", sales: 0, transactions: 0 },
      { label: "7 AM", sales: 85_000, transactions: 3 },
      { label: "8 AM", sales: 195_000, transactions: 7 },
      { label: "9 AM", sales: 310_000, transactions: 11 },
      { label: "10 AM", sales: 260_000, transactions: 9 },
      { label: "11 AM", sales: 380_000, transactions: 14 },
      { label: "12 PM", sales: 490_000, transactions: 18 },
      { label: "1 PM", sales: 420_000, transactions: 15 },
      { label: "2 PM", sales: 285_000, transactions: 10 },
      { label: "3 PM", sales: 210_000, transactions: 7 },
      { label: "4 PM", sales: 180_000, transactions: 6 },
      { label: "5 PM", sales: 255_000, transactions: 9 },
    ],
    weekly: [
      { label: "Lun", sales: 2_150_000, transactions: 78 },
      { label: "Mar", sales: 1_980_000, transactions: 72 },
      { label: "Mié", sales: 2_450_000, transactions: 89 },
      { label: "Jue", sales: 2_280_000, transactions: 83 },
      { label: "Vie", sales: 3_650_000, transactions: 132 },
      { label: "Sáb", sales: 4_120_000, transactions: 148 },
      { label: "Dom", sales: 1_820_000, transactions: 66 },
    ],
    monthly: [
      { label: "1", sales: 2_450_000, transactions: 89 },
      { label: "2", sales: 2_180_000, transactions: 79 },
      { label: "3", sales: 1_950_000, transactions: 71 },
      { label: "4", sales: 2_680_000, transactions: 97 },
      { label: "5", sales: 2_320_000, transactions: 84 },
      { label: "6", sales: 3_150_000, transactions: 114 },
      { label: "7", sales: 2_890_000, transactions: 105 },
      { label: "8", sales: 2_540_000, transactions: 92 },
      { label: "9", sales: 2_280_000, transactions: 83 },
      { label: "10", sales: 3_450_000, transactions: 125 },
      { label: "11", sales: 3_120_000, transactions: 113 },
      { label: "12", sales: 2_780_000, transactions: 101 },
      { label: "13", sales: 2_350_000, transactions: 85 },
      { label: "14", sales: 2_150_000, transactions: 78 },
      { label: "15", sales: 2_920_000, transactions: 106 },
      { label: "16", sales: 3_350_000, transactions: 122 },
      { label: "17", sales: 3_680_000, transactions: 134 },
      { label: "18", sales: 4_050_000, transactions: 147 },
      { label: "19", sales: 3_250_000, transactions: 118 },
      { label: "20", sales: 2_580_000, transactions: 94 },
      { label: "21", sales: 2_780_000, transactions: 101 },
      { label: "22", sales: 2_250_000, transactions: 82 },
      { label: "23", sales: 1_950_000, transactions: 71 },
      { label: "24", sales: 1_680_000, transactions: 61 },
      { label: "25", sales: 2_850_000, transactions: 104 },
      { label: "26", sales: 3_180_000, transactions: 115 },
      { label: "27", sales: 2_420_000, transactions: 88 },
      { label: "28", sales: 2_150_000, transactions: 78 },
      { label: "29", sales: 2_950_000, transactions: 107 },
      { label: "30", sales: 3_480_000, transactions: 126 },
    ],
  },

  activeOrders: [
    {
      id: "ORD-001",
      customerName: "Carlos Méndez",
      phone: "+57 310 234 5678",
      items: ["2x Bandeja Paisa", "1x Sancocho", "2x Limonada"],
      itemCount: 5,
      total: 135_000,
      createdAt: "12:15 PM",
      estimatedDelivery: "12:45 PM",
      status: "on_the_way",
      progress: 80,
      address: "Cra 45 #67-12, Apt 302",
      paymentMethod: "Efectivo",
    },
    {
      id: "ORD-002",
      customerName: "María López",
      phone: "+57 315 876 5432",
      items: ["1x Arroz con Pollo", "1x Jugo Natural"],
      itemCount: 2,
      total: 48_000,
      createdAt: "12:22 PM",
      estimatedDelivery: "12:55 PM",
      status: "preparing",
      progress: 40,
      address: "Calle 80 #15-30, Barrio Norte",
      paymentMethod: "Nequi",
      notes: "Sin cebolla, por favor",
    },
    {
      id: "ORD-003",
      customerName: "Andrés García",
      phone: "+57 320 111 2233",
      items: ["3x Empanadas", "2x Cerveza Águila", "1x Patacón"],
      itemCount: 6,
      total: 82_000,
      createdAt: "12:30 PM",
      estimatedDelivery: "1:00 PM",
      status: "pending",
      progress: 10,
      address: "Transv 23 #45-67",
      paymentMethod: "Daviplata",
    },
    {
      id: "ORD-004",
      customerName: "Laura Rodríguez",
      phone: "+57 301 444 5566",
      items: ["1x Ajiaco", "1x Tinto", "1x Postre"],
      itemCount: 3,
      total: 65_000,
      createdAt: "12:05 PM",
      estimatedDelivery: "12:35 PM",
      status: "ready",
      progress: 65,
      address: "Cra 7 #22-18, Oficina 501",
      paymentMethod: "Efectivo",
    },
    {
      id: "ORD-005",
      customerName: "Pedro Sánchez",
      phone: "+57 318 777 8899",
      items: ["2x Picada Mixta", "2x Gaseosa", "1x Tostadas"],
      itemCount: 5,
      total: 120_000,
      createdAt: "11:50 AM",
      estimatedDelivery: "12:20 PM",
      status: "delivered",
      progress: 100,
      address: "Calle 53 #10-45, Local 3",
      paymentMethod: "Tarjeta Crédito",
    },
    {
      id: "ORD-006",
      customerName: "Diana Torres",
      phone: "+57 302 333 4455",
      items: ["1x Cazuela de Mariscos", "2x Agua de Coco"],
      itemCount: 3,
      total: 95_000,
      createdAt: "12:35 PM",
      estimatedDelivery: "1:10 PM",
      status: "preparing",
      progress: 35,
      address: "Av 68 #26-89, Penthouse",
      paymentMethod: "Efectivo",
      notes: "Extra limón",
    },
  ],

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
    previousMonthTotal: 72_500_000,
    currentMonthTotal: 78_500_000,
    weeks: [
      { label: "Week 1", sublabel: "Day 01–07", previousMonth: 16_200_000, currentMonth: 17_800_000 },
      { label: "Week 2", sublabel: "Day 08–14", previousMonth: 19_500_000, currentMonth: 21_200_000 },
      { label: "Week 3", sublabel: "Day 15–21", previousMonth: 18_800_000, currentMonth: 20_500_000 },
      { label: "Week 4", sublabel: "Day 22–31", previousMonth: 18_000_000, currentMonth: 19_000_000 },
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
