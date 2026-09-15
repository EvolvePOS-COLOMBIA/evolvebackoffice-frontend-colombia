import { useQuery } from "@tanstack/react-query"
import type { Period } from "../mock/dashboard-data"
import {
  getDashboardStats,
  getDepartmentSales,
  getTenderReport,
  getSalesByPeriod,
  getActiveOrders,
  getYearOnYear,
  getVsPreviousMonth,
} from "../services/dashboard.service"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (period: Period) => [...dashboardKeys.all, "stats", period] as const,
  departmentSales: (period: Period) => [...dashboardKeys.all, "departmentSales", period] as const,
  tenderReport: (period: Period) => [...dashboardKeys.all, "tenderReport", period] as const,
  salesByPeriod: (period: Period) => [...dashboardKeys.all, "salesByPeriod", period] as const,
  activeOrders: () => [...dashboardKeys.all, "activeOrders"] as const,
  yearOnYear: () => [...dashboardKeys.all, "yearOnYear"] as const,
  vsPreviousMonth: () => [...dashboardKeys.all, "vsPreviousMonth"] as const,
}

export function useDashboardStats(period: Period) {
  return useQuery({
    queryKey: dashboardKeys.stats(period),
    queryFn: () => getDashboardStats(period),
  })
}

export function useDepartmentSales(period: Period) {
  return useQuery({
    queryKey: dashboardKeys.departmentSales(period),
    queryFn: () => getDepartmentSales(period),
  })
}

export function useTenderReport(period: Period) {
  return useQuery({
    queryKey: dashboardKeys.tenderReport(period),
    queryFn: () => getTenderReport(period),
  })
}

export function useSalesByPeriod(period: Period) {
  return useQuery({
    queryKey: dashboardKeys.salesByPeriod(period),
    queryFn: () => getSalesByPeriod(period),
  })
}

export function useActiveOrders() {
  return useQuery({
    queryKey: dashboardKeys.activeOrders(),
    queryFn: () => getActiveOrders(),
  })
}

export function useYearOnYear() {
  return useQuery({
    queryKey: dashboardKeys.yearOnYear(),
    queryFn: () => getYearOnYear(),
  })
}

export function useVsPreviousMonth() {
  return useQuery({
    queryKey: dashboardKeys.vsPreviousMonth(),
    queryFn: () => getVsPreviousMonth(),
  })
}
