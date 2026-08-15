export interface TenantClient {
  id: string
  businessName: string
  slug: string
  adminEmail: string
  phone: string
  status: "active" | "inactive"
  createdAt: string
}

export interface TenantClientFormValues {
  businessName: string
  slug: string
  adminEmail: string
  phone: string
  status: "active" | "inactive"
}
