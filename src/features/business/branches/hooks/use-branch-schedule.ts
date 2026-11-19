import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getBranchSchedule,
  updateBranchSchedule,
  type BranchSchedule,
} from "@/features/business/branches/services/branch-schedule.service"

export const branchScheduleKeys = {
  detail: (branchId: string) => ["branch-schedule", branchId] as const,
}

export function useBranchSchedule(branchId: string | null | undefined) {
  return useQuery({
    queryKey: branchScheduleKeys.detail(branchId ?? ""),
    queryFn: () => getBranchSchedule(branchId!),
    enabled: Boolean(branchId),
  })
}

export function useUpdateBranchSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ branchId, schedule }: { branchId: string; schedule: BranchSchedule }) =>
      updateBranchSchedule(branchId, schedule),
    onSuccess: (_data, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: branchScheduleKeys.detail(branchId) })
      // The closing window is derived from this schedule.
      queryClient.invalidateQueries({ queryKey: ["order-closing-preview"] })
    },
  })
}
