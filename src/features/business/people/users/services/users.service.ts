import { api } from "@/config/axios-client"
import type { CreateUserDto, UpdateUserDto, UserResponseDto } from "../types"

export async function getUsers(): Promise<UserResponseDto[]> {
  const { data } = await api.get<UserResponseDto[]>("/api/Auth/users")
  return data
}

export async function getUserById(id: string): Promise<UserResponseDto> {
  const { data } = await api.get<UserResponseDto>(`/api/Auth/users/${id}`)
  return data
}

export async function createUser(payload: CreateUserDto): Promise<UserResponseDto> {
  const { data } = await api.post<UserResponseDto>("/api/Auth/users", payload)
  return data
}

export async function updateUser(id: string, payload: UpdateUserDto): Promise<UserResponseDto> {
  const { data } = await api.put<UserResponseDto>(`/api/Auth/users/${id}`, payload)
  return data
}
