import { api } from "@/config/axios-client"
import type { CreatePaymentMethodDto, PaymentMethodResponseDto, UpdatePaymentMethodDto } from "../types"

export async function getActivePaymentMethods(): Promise<PaymentMethodResponseDto[]> {
  const { data } = await api.get<PaymentMethodResponseDto[]>("/api/payment-methods")
  return data ?? []
}

export async function getAllPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
  const { data } = await api.get<PaymentMethodResponseDto[]>("/api/payment-methods/all")
  return data ?? []
}

export async function createPaymentMethod(payload: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
  const { data } = await api.post<PaymentMethodResponseDto>("/api/payment-methods", payload)
  return data
}

export async function updatePaymentMethod(
  id: string,
  payload: UpdatePaymentMethodDto
): Promise<PaymentMethodResponseDto> {
  const { data } = await api.put<PaymentMethodResponseDto>(`/api/payment-methods/${id}`, payload)
  return data
}

export async function setActivePaymentMethod(id: string, active: boolean): Promise<PaymentMethodResponseDto> {
  const { data } = await api.post<PaymentMethodResponseDto>(
    `/api/payment-methods/${id}/${active ? "activate" : "deactivate"}`
  )
  return data
}

export async function restoreCountryDefaults(countryCode?: string): Promise<{ inserted: number }> {
  const { data } = await api.post<{ inserted: number }>("/api/payment-methods/restore-country-defaults", null, {
    params: countryCode ? { countryCode } : undefined,
  })
  return data ?? { inserted: 0 }
}
