import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getRegisterPrintSettings, upsertRegisterPrintSettings } from "../services/register-print-settings.service"
import type { UpdateRegisterPrintSettingsDto } from "../types/print"

export const registerPrintSettingsKeys = {
  byRegister: (registerId: string) => ["register-print-settings", registerId] as const,
}

export function useRegisterPrintSettings(registerId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: registerPrintSettingsKeys.byRegister(registerId ?? ""),
    queryFn: () => getRegisterPrintSettings(registerId!),
    enabled: Boolean(registerId) && enabled,
  })
}

export function useUpsertRegisterPrintSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ registerId, payload }: { registerId: string; payload: UpdateRegisterPrintSettingsDto }) =>
      upsertRegisterPrintSettings(registerId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(registerPrintSettingsKeys.byRegister(data.registerId), data)
    },
  })
}
