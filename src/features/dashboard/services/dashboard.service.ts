import type { AxiosResponse } from "axios"

import { api } from "@/config/axios-client"
import type { DashboardSummaryResponse } from "@/types/domain"

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response: AxiosResponse<DashboardSummaryResponse> = await api.get("/api/dashboard/summary")
  return response.data
}

