/**
 * DTOs de `/api/suppliers` tal como los expone el backend.
 * Los datos personales (nombres, identificación, contacto) viven en la tabla
 * compartida Persons y se reflejan en estas respuestas vía `personPublicId`.
 */
export interface SupplierResponseDto {
  id: string
  personPublicId: string | null
  firstName: string
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  address: string | null
  phoneNumber: string | null
  emailAddress: string | null
  company: string
  inactive: boolean
  address2: string | null
  url: string | null
  accountNumber: string | null
  code: string | null
  createdAt: string
}

export interface CreateSupplierDto {
  company: string
  firstName: string
  identificationTypeId: number
  lastName?: string | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  address2?: string | null
  url?: string | null
  accountNumber?: string | null
  code?: string | null
}

export interface UpdateSupplierDto {
  firstName: string
  lastName?: string | null
  identificationTypeId?: number | null
  identificationNumber?: string | null
  address?: string | null
  phoneNumber?: string | null
  emailAddress?: string | null
  company?: string | null
  address2?: string | null
  url?: string | null
  accountNumber?: string | null
  code?: string | null
}

export interface SupplierListResult {
  items: SupplierResponseDto[]
  totalCount: number
}
