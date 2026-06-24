import { useQuery, useMutation } from "@tanstack/react-query"
import { queryClient } from "@/config/react-query"

import { createUser, deleteUser, updateUser, getUsers } from "@/features/auth/services/auth.service"
import type { CreateUserRequest, UpdateUserRequest } from "@/types/domain"

export function useGetUsers(enabled = true) {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled,
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: (payload: { userId: string; data: UpdateUserRequest }) => updateUser(payload.userId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
