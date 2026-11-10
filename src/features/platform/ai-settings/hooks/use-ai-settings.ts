import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getAiSetting, testAiSetting, updateAiSetting } from "../services/ai-settings.service"
import type { UpdateAiSettingFormValues } from "../types"

export const aiSettingKeys = {
  all: ["aiSetting"] as const,
}

export function useAiSetting() {
  return useQuery({
    queryKey: aiSettingKeys.all,
    queryFn: getAiSetting,
  })
}

export function useUpdateAiSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAiSettingFormValues) => updateAiSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSettingKeys.all })
    },
  })
}

export function useTestAiSetting() {
  return useMutation({
    mutationFn: () => testAiSetting(),
  })
}
