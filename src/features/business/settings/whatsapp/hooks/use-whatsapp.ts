import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppQr,
  getWhatsAppStatus,
  sendWhatsAppTest,
  updateWhatsAppSettings,
} from "../services/whatsapp.service"
import type { UpdateWhatsAppSettingsPayload, WhatsAppQr, WhatsAppStatus } from "../types"

/** Mientras se espera el escaneo se consulta el estado cada 3 s. */
const CONNECTING_POLL_MS = 3_000
/** El QR vence a los ~40 s: se pide uno nuevo antes. */
const QR_REFRESH_MS = 30_000

export const whatsAppKeys = {
  all: ["whatsapp"] as const,
  status: () => ["whatsapp", "status"] as const,
  qr: () => ["whatsapp", "qr"] as const,
}

export function useWhatsAppStatus(enabled = true) {
  return useQuery<WhatsAppStatus>({
    queryKey: whatsAppKeys.status(),
    queryFn: getWhatsAppStatus,
    enabled,
    refetchInterval: (query) => (query.state.data?.status === "Connecting" ? CONNECTING_POLL_MS : false),
  })
}

/** QR vigente; el primero lo deja `useConnectWhatsApp` en la caché. */
export function useWhatsAppQr(enabled: boolean) {
  return useQuery<WhatsAppQr>({
    queryKey: whatsAppKeys.qr(),
    queryFn: getWhatsAppQr,
    enabled,
    staleTime: QR_REFRESH_MS,
    refetchInterval: enabled ? QR_REFRESH_MS : false,
  })
}

export function useConnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (phoneNumber: string) => connectWhatsApp(phoneNumber),
    onSuccess: (qr) => {
      queryClient.setQueryData(whatsAppKeys.qr(), qr)
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.status() })
    },
  })
}

export function useUpdateWhatsAppSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateWhatsAppSettingsPayload) => updateWhatsAppSettings(payload),
    onSuccess: (status) => queryClient.setQueryData(whatsAppKeys.status(), status),
  })
}

export function useSendWhatsAppTest() {
  return useMutation({
    mutationFn: (phoneNumber: string) => sendWhatsAppTest(phoneNumber),
  })
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: (status) => {
      queryClient.setQueryData(whatsAppKeys.status(), status)
      queryClient.removeQueries({ queryKey: whatsAppKeys.qr() })
    },
  })
}
