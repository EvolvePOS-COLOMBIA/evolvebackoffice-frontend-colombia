/**
 * Modelo de `/api/persons` — la tabla Persons es compartida por Usuarios,
 * Clientes y Proveedores: una sola fila de persona alimenta los tres CRUD.
 *
 * El backend valida tipo de identificación 1 = CC y 2 = CE.
 */
export enum IdentificationType {
  CedulaCiudadania = 1,
  CedulaExtranjeria = 2,
}

export const IDENTIFICATION_TYPE_LABELS: Record<number, string> = {
  [IdentificationType.CedulaCiudadania]: "CC",
  [IdentificationType.CedulaExtranjeria]: "CE",
}

export function identificationTypeLabel(typeId: number | null | undefined): string {
  if (typeId == null) return "—"
  return IDENTIFICATION_TYPE_LABELS[typeId] ?? String(typeId)
}

export interface PersonResponseDto {
  id: string
  identificationTypeId: number
  identificationNumber: string | null
  firstName: string
  lastName: string | null
  dateBirth: string | null
  address: string | null
  company: string | null
  country: string | null
  state: string | null
  city: string | null
  zip: string | null
  phoneNumber: string | null
  faxNumber: string | null
  emailAddress: string | null
  storeId: number
  createdAt: string
}

export function personDisplayName(person: Pick<PersonResponseDto, "firstName" | "lastName">): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim() || "—"
}
