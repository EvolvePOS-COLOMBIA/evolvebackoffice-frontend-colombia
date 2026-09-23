/**
 * DTOs de `/api/Customers` tal como los expone el backend.
 * Fuente: Swagger de juacopizza.ursposdemo.com (`CustomerResponseDto`,
 * `CreateCustomerDto`, `UpdateCustomerDto`).
 *
 * Patrón Doble Identificador: las rutas reciben GUID, las respuestas
 * exponen `id` como GUID.
 */

export { IdentificationType, IDENTIFICATION_TYPE_LABELS } from "@/features/business/people/users/types"

export interface CustomerResponseDto {
  id: string
  personPublicId: string | null
  firstName: string | null
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  address: string | null
  phoneNumber: string | null
  emailAddress: string | null
  city: string | null
  department: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateCustomerDto {
  firstName: string | null
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  city?: string | null
  department?: string | null
}

export interface UpdateCustomerDto {
  firstName?: string | null
  lastName?: string | null
  identificationTypeId?: number | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  city?: string | null
  department?: string | null
}

/**
 * El backend puede devolver `fullName` derivado, pero los customers no lo
 * tienen. Compone el nombre a partir de firstName / lastName.
 */
export function getCustomerDisplayName(customer: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
}): string {
  if (customer.fullName?.trim()) {
    return customer.fullName.trim()
  }

  const composed = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
  return composed || "—"
}
