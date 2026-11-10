import { api } from "@/config/axios-client"
import type { CreditHistoryResult, CreditMovementDto, PendingAuthorizationDto, PersonCreditResponseDto } from "../types"

/** Estado del cupo de crédito de una persona (web: solo lectura + activación). */
export async function getPersonCredit(personId: string): Promise<PersonCreditResponseDto | null> {
  const { data } = await api.get<PersonCreditResponseDto | null>(`/api/persons/${personId}/credit`)
  return data ?? null
}

/** Activa o ajusta el cupo. Requiere email en la persona; puede devolver pinDeliveryError. */
export async function activatePersonCredit(
  personId: string,
  creditLimit: number
): Promise<{ account: PersonCreditResponseDto; pinDeliveryError: string | null }> {
  const { data } = await api.put<{ account: PersonCreditResponseDto; pinDeliveryError: string | null }>(
    `/api/persons/${personId}/credit`,
    { creditLimit }
  )
  return data
}

/** Rotación del PIN (única acción administrativa) + reenvío por correo. */
export async function resendCreditPin(personId: string): Promise<{ pinDeliveryError: string | null }> {
  const { data } = await api.post<{ pinDeliveryError: string | null }>(`/api/persons/${personId}/credit/pin/resend`)
  return data
}

/** Historial de consumos y abonos (paginado). */
export async function getCreditHistory(personId: string, pageNumber = 1, pageSize = 10): Promise<CreditHistoryResult> {
  const { data } = await api.get<{ data: CreditMovementDto[]; totalCount: number }>(
    `/api/persons/${personId}/credit-history`,
    { params: { pageNumber, pageSize } }
  )
  return { items: data?.data ?? [], totalCount: data?.totalCount ?? 0 }
}

/**
 * Autorizaciones de crédito pendientes de liquidar (venta autorizada en el POS
 * que aún no ha sincronizado su lote). Consulta administrativa (F5).
 */
export async function getPendingAuthorizations(): Promise<PendingAuthorizationDto[]> {
  const { data } = await api.get<PendingAuthorizationDto[]>("/api/credit/authorizations")
  return data ?? []
}
