import type { BranchFormValues } from "@/features/business/branches/types"
import type { CreateBranchDto } from "@/features/business/branches/types/api"

/** Form coordinate → number; empty → null (optional in the backend). */
function toCoordinate(value: string): number | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : Number(trimmed)
}

/** Form values → body of the create and update endpoints. */
export function branchValuesToPayload(values: BranchFormValues): CreateBranchDto {
  return {
    name: values.name,
    adminUserId: values.adminUserId || null,
    identification: values.identification || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
    latitude: toCoordinate(values.latitude),
    longitude: toCoordinate(values.longitude),
    isSupplier: values.isSupplier,
    timeZoneId: values.timeZoneId || undefined,
  }
}
