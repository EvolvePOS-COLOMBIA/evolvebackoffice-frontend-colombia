import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listPlatformUsers,
  getPlatformUser,
  createPlatformUser,
  updatePlatformUser,
  activatePlatformUser,
  deactivatePlatformUser,
} from "../services/platform-user.service"
import type { CreatePlatformUserRequest, UpdatePlatformUserRequest } from "../types"

export function usePlatformUsers() {
  return useQuery({
    queryKey: ["platformUsers"],
    queryFn: listPlatformUsers,
  })
}

export function usePlatformUser(id: string) {
  return useQuery({
    queryKey: ["platformUser", id],
    queryFn: () => getPlatformUser(id),
    enabled: !!id,
  })
}

export function useCreatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePlatformUserRequest) => createPlatformUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformUsers"] })
    },
  })
}

export function useUpdatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlatformUserRequest }) => updatePlatformUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformUsers"] })
    },
  })
}

export function useActivatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activatePlatformUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformUsers"] })
    },
  })
}

export function useDeactivatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivatePlatformUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformUsers"] })
    },
  })
}
