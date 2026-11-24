import { api } from "@/config/axios-client"
import {
  buildLegacyPayload,
  canSaveLegacy,
  parseScheduleResponse,
  type ScheduleResponse,
  type WeekDay,
  type WeekSchedule,
} from "@/features/business/branches/utils/schedule"

export type { WeekDay, WeekSchedule }

/**
 * Weekly schedule of a branch. It defines the window of the orders closing.
 *
 * Compatibility adapter: the target contract is `{ timeZoneId?, days[7] }`, but the backend may still answer
 * (and only accept) the legacy `{ openingTime, closingTime }` pair. The mode is decided by the GET response.
 */
export async function getBranchSchedule(branchId: string): Promise<WeekSchedule> {
  const { data } = await api.get<ScheduleResponse>(`/api/branches/${branchId}/schedule`)
  return parseScheduleResponse(data)
}

export async function updateBranchSchedule(
  branchId: string,
  days: WeekDay[],
  supportsPerDay: boolean
): Promise<WeekSchedule> {
  const path = `/api/branches/${branchId}/schedule`
  if (supportsPerDay) {
    const { data } = await api.put<ScheduleResponse | undefined>(path, { days })
    return data ? parseScheduleResponse(data) : { days, supportsPerDay: true }
  }
  // Legacy backend: one pair for the whole week, so the days must be identical and all open.
  if (!canSaveLegacy(days)) throw new Error("The backend does not support different hours per day yet")
  const payload = buildLegacyPayload(days)
  const { data } = await api.put<ScheduleResponse | undefined>(path, payload)
  return data ? parseScheduleResponse(data) : parseScheduleResponse(payload)
}
