import { api } from "@/config/axios-client"
import type { PersonResponseDto } from "./types"

/**
 * Consulta exacta a la tabla compartida Persons por tipo + número de identificación.
 * Devuelve la persona existente o null (el backend responde 200 con body null
 * cuando no hay coincidencia).
 */
export async function findPersonByIdentification(
  identificationTypeId: number,
  identificationNumber: string
): Promise<PersonResponseDto | null> {
  const { data } = await api.get<PersonResponseDto | null>("/api/persons/by-identification", {
    params: { identificationTypeId, identificationNumber },
  })
  return data ?? null
}
