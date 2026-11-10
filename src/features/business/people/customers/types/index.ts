/**
 * DTOs de `/api/customers` tal como los expone el backend.
 * Los datos personales (nombres, identificación, contacto) viven en la tabla
 * compartida Persons y se reflejan en estas respuestas vía `personPublicId`.
 */
export interface CustomerResponseDto {
  id: string
  personPublicId: string | null
  firstName: string
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
  firstName: string
  identificationTypeId: number
  lastName?: string | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  city?: string | null
  department?: string | null
}

export interface UpdateCustomerDto {
  firstName: string
  lastName?: string | null
  identificationTypeId?: number | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  city?: string | null
  department?: string | null
}

export interface CustomerListResult {
  items: CustomerResponseDto[]
  totalCount: number
}
