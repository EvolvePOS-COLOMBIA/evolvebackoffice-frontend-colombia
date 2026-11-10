import { api } from "@/config/axios-client"
import type { Period } from "../mock/dashboard-data"

export interface DashboardStats {
  grossSales: number
  taxes: number
  netSales: number
  customers: number
  voidedAmount: number
  voidCount: number
  cancelTrans: number
  /** Cantidad de transacciones POS canceladas en el periodo. */
  cancelTransCount: number
  itemsSold: number
  webSales: number
  /** Ventas de órdenes web (Cluvi+Woo) entregadas en el periodo. */
  webOrderSales: number
  /** Impuesto (Order.Tax) incluido en webOrderSales. */
  webOrderTax: number
  /** Ventas de órdenes manuales confirmadas (o superiores) en el periodo. */
  manualOrderSales: number
  /** Impuesto (Order.Tax) incluido en manualOrderSales. */
  manualOrderTax: number
  /** Total de ventas de todas las fuentes: POS + web + manuales. */
  totalSales: number
  /** Domicilios (envío) cobrados en el periodo — solo órdenes Delivered. */
  shippingCollected: number
}

export interface DashboardDepartmentSales {
  department: string
  sales: number
}

export interface DashboardTenderReport {
  description: string
  /** Categoría estable del medio (Cash, Transfer, Credit…). */
  category: string
  quantity: number
  sales: number
  /** Participación sobre el total del tender (0–100). */
  share: number
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
  /** Sucursal de la orden (el dashboard es tenant-wide; Órdenes filtra por sucursal). */
  branchId?: string | null
  branchName?: string | null
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
