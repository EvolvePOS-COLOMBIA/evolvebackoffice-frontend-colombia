import { api } from "@/config/axios-client"

/** Opening and closing hour of a branch ("HH:mm:ss"). It defines the window of the orders closing. */
export interface BranchSchedule {
  openingTime: string
  closingTime: string
}

export async function getBranchSchedule(branchId: string): Promise<BranchSchedule> {
  const { data } = await api.get<BranchSchedule>(`/api/branches/${branchId}/schedule`)
  return data
}

export async function updateBranchSchedule(branchId: string, schedule: BranchSchedule): Promise<BranchSchedule> {
  const { data } = await api.put<BranchSchedule>(`/api/branches/${branchId}/schedule`, schedule)
  return data ?? schedule
}
