import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"
import { appConfig } from "@/config/env"
import { expireSession } from "@/features/auth/services/session-expiry"
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

// Auth endpoints: a 401 there means bad credentials (login and change-password),
// not an expired session. Excluding them prevents logging the user out after a
// typo on the sign-in form.
const AUTH_ENDPOINT_PATTERN = /\/api\/Auth\//i

// Response guard that ends the session as soon as the access token expires,
// instead of waiting for another request or navigation to re-evaluate expiry.
// Errors are always re-rejected as-is so every caller's error handling keeps
// working unchanged.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ""

      if (!AUTH_ENDPOINT_PATTERN.test(url)) {
        expireSession()
      }
    }

    return Promise.reject(error)
  }
)
