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
  // Sacamos el token directamente del "hook" de Zustand en tiempo real
  const token = useAppStore.getState().session?.accessToken

  // Si el token existe, se lo pegamos a los encabezados de seguridad
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
