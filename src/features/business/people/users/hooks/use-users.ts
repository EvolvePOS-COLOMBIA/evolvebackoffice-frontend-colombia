import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createUser, getUserById, getUsers, updateUser } from "../services/users.service"
import type { CreateUserDto, UpdateUserDto } from "../types"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  })
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserDto) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserDto }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
