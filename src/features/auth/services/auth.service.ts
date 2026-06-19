import type { AxiosResponse } from "axios"

import { api } from "@/config/axios-client"
import type { CreateUserRequest, LoginResponse, UpdateUserRequest, UserResponse } from "@/types/domain"

export type LoginRequest = {
  email: string
  password: string
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response: AxiosResponse<LoginResponse> = await api.post("/api/auth/login", {
    userNameOrEmail: payload.email,
    password: payload.password,
  })
  return response.data
}

export async function getUsers(): Promise<UserResponse[]> {
  const response: AxiosResponse<UserResponse[]> = await api.get("/api/auth/users")
  return response.data
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const response: AxiosResponse<UserResponse> = await api.post("/api/auth/users", payload)
  return response.data
}

export async function updateUser(userId: string, payload: UpdateUserRequest): Promise<UserResponse> {
  const response: AxiosResponse<UserResponse> = await api.put(`/api/auth/users/${userId}`, payload)
  return response.data
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/api/auth/users/${userId}`)
}
