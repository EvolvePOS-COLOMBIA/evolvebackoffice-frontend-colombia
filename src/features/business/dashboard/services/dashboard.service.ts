import { api } from "@/config/axios-client"
import type { Period } from "../mock/dashboard-data"

export interface DashboardStats {
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

export interface DashboardDepartmentSales {
  department: string
  sales: number
}

export interface DashboardTenderReport {
  description: string
  quantity: number
  sales: number
}

export interface DashboardSalesByPeriodPoint {
  label: string
  sales: number
  transactions: number
}

export interface DashboardSalesByPeriod {
  hourly: DashboardSalesByPeriodPoint[]
  weekly: DashboardSalesByPeriodPoint[]
  monthly: DashboardSalesByPeriodPoint[]
}

export interface DashboardActiveOrder {
  id: string
  customerName: string
  phone: string
  items: string[]
  itemCount: number
  total: number
  createdAt: string
  estimatedDelivery: string
  status: string
  progress: number
  address: string
  paymentMethod: string
  notes?: string
}

export interface DashboardYearOnYearMonth {
  month: string
  year2025: number
  year2026: number
}

export interface DashboardYearOnYear {
  total2025: number
  total2026: number
  months: DashboardYearOnYearMonth[]
}

export interface DashboardVsPreviousMonthWeek {
  label: string
  sublabel: string
  previousMonth: number
  currentMonth: number
}

export interface DashboardVsPreviousMonth {
  currentMonthName: string
  previousMonthName: string
  previousMonthTotal: number
  currentMonthTotal: number
  weeks: DashboardVsPreviousMonthWeek[]
}

const BASE = "/api/dashboard"

export async function getDashboardStats(period: Period): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>(`${BASE}/stats`, { params: { period } })
  return data
}

export async function getDepartmentSales(period: Period): Promise<DashboardDepartmentSales[]> {
  const { data } = await api.get<DashboardDepartmentSales[]>(`${BASE}/department-sales`, { params: { period } })
  return data
}

export async function getTenderReport(period: Period): Promise<DashboardTenderReport[]> {
  const { data } = await api.get<DashboardTenderReport[]>(`${BASE}/tender-report`, { params: { period } })
  return data
}

export async function getSalesByPeriod(period: Period): Promise<DashboardSalesByPeriod> {
  const { data } = await api.get<DashboardSalesByPeriod>(`${BASE}/sales-by-period`, { params: { period } })
  return data
}

export async function getActiveOrders(): Promise<DashboardActiveOrder[]> {
  const { data } = await api.get<DashboardActiveOrder[]>(`${BASE}/active-orders`)
  return data
}

export async function getYearOnYear(): Promise<DashboardYearOnYear> {
  const { data } = await api.get<DashboardYearOnYear>(`${BASE}/year-on-year`)
  return data
}

export async function getVsPreviousMonth(): Promise<DashboardVsPreviousMonth> {
  const { data } = await api.get<DashboardVsPreviousMonth>(`${BASE}/vs-previous-month`)
  return data
}
