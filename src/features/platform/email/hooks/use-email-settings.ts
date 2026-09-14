import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getEmailSetting, updateEmailSetting, sendTestEmail } from "../services/email.service"
import type { UpdateEmailSettingFormValues, SendTestEmailFormValues } from "../types"

export function useEmailSetting() {
  return useQuery({
    queryKey: ["emailSetting"],
    queryFn: getEmailSetting,
  })
}

export function useUpdateEmailSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEmailSettingFormValues) => updateEmailSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSetting"] })
    },
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (data: SendTestEmailFormValues) => sendTestEmail(data),
  })
}
