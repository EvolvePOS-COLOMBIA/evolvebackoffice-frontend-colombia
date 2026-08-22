import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"
import { appConfig } from "@/config/env"
import { useAppStore } from "@/store/app-store"

// Configuración inicial de Axios con la dirección del servidor
export const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

// Guardián que intercepta cada petición antes de que salga al servidor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = useAppStore.getState()
  const token = state.session?.accessToken
  const tenantId = state.session?.tenantId

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (tenantId && config.headers) {
    config.headers["X-Tenant-Id"] = tenantId
  }

  return config
})
