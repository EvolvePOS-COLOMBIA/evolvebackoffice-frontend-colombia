import { useMutation, useQuery } from "@tanstack/react-query"

import { queryClient } from "@/config/react-query"
import {
  createSoftware,
  deleteSoftware,
  getSoftwares,
  updateSoftware,
} from "@/features/softwares/services/software.service"
import { useNotify } from "@/hooks/use-notify"
import type { CreateSoftwareRequest } from "@/types/domain"

export function useSoftwares() {
  return useQuery({
    queryKey: ["softwares"],
    queryFn: getSoftwares,
  })
}

export function useCreateSoftware() {
  const notify = useNotify()

  return useMutation({
    mutationFn: (payload: CreateSoftwareRequest) => createSoftware(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["softwares"] })
      notify.success("Software created successfully.")
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Software creation failed: unknown error.")
    },
  })
}

export function useUpdateSoftware() {
  const notify = useNotify()

  return useMutation({
    mutationFn: (payload: { softwareId: string; data: CreateSoftwareRequest }) =>
      updateSoftware(payload.softwareId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["softwares"] })
      notify.success("Software updated successfully.")
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Software update failed: unknown error.")
    },
  })
}

export function useDeleteSoftware() {
  const notify = useNotify()

  return useMutation({
    mutationFn: (softwareId: string) => deleteSoftware(softwareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["softwares"] })
      queryClient.invalidateQueries({ queryKey: ["versions", "all"] })
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Software deletion failed: unknown error.")
    },
  })
}
