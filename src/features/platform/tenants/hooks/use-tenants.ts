import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getTenants,
  createTenant,
  updateTenant,
  activateTenant,
  deactivateTenant,
  deleteTenant,
  getSerialCodes,
  decommissionSerial,
  resetAdminCredentials,
  canCreateRegister,
  adjustSerialCodes,
  approveTenant,
  rejectTenant,
} from "@/features/platform/tenants/services/tenant.service"
import type {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantModuleItemDto,
  AdjustSerialCodesDto,
} from "@/features/platform/tenants/types/api"
import type { TenantFormValues } from "@/features/platform/tenants/types"

function toModuleItems(modules: TenantFormValues["modules"]): UpdateTenantModuleItemDto[] {
  return modules.map((m) => ({
    modulePublicId: m.moduleId,
    isEnabled: m.isEnabled,
    quantity: m.quantity,
  }))
}

function toCreateDto(values: TenantFormValues): CreateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
    countryCode: values.countryCode || null,
    maxRegisters: values.maxRegisters,
    adminIdentification: values.adminIdentification || null,
    subdomain: values.subdomain || null,
    identificationNumber: values.identificationNumber || null,
    identificationTypeId: values.identificationTypeId,
    maxBranches: values.maxBranches || null,
    maxUsers: values.maxUsers || null,
    timeZoneId: values.timeZoneId || null,
    modules: values.modules.length > 0 ? toModuleItems(values.modules) : null,
  }
}

function toUpdateDto(values: TenantFormValues): UpdateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
    countryCode: values.countryCode || null,
    subdomain: values.subdomain || null,
    identificationNumber: values.identificationNumber || null,
    identificationTypeId: values.identificationTypeId || null,
    maxRegisters: values.maxRegisters || null,
    maxBranches: values.maxBranches || null,
    maxUsers: values.maxUsers || null,
    timeZoneId: values.timeZoneId || null,
    modules: values.modules.length > 0 ? toModuleItems(values.modules) : null,
  }
}

export function useTenants(page: number, pageSize: number) {
  return useQuery({
    queryKey: ["tenants", page, pageSize],
    queryFn: () => getTenants(page, pageSize),
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    // Datos + módulos en UNA sola petición (POST /api/tenants con modules[]).
    mutationFn: (values: TenantFormValues) => createTenant(toCreateDto(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    // Datos + módulos en UNA sola petición (PUT /api/tenants/{id} con modules[]).
    mutationFn: ({ id, values }: { id: string; values: TenantFormValues }) => updateTenant(id, toUpdateDto(values)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["tenant-modules", variables.id] })
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useSerialCodes(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-serial-codes", tenantId],
    queryFn: () => getSerialCodes(tenantId!),
    enabled: Boolean(tenantId),
  })
}

export function useDecommissionSerial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, serialId, reason }: { tenantId: string; serialId: string; reason?: string }) =>
      decommissionSerial(tenantId, serialId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-serial-codes", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] })
    },
  })
}

export function useResetAdminCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => resetAdminCredentials(tenantId),
    onSuccess: (_data, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] })
    },
  })
}

export function useCanCreateRegister(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-can-create-register", tenantId],
    queryFn: () => canCreateRegister(tenantId!),
    enabled: Boolean(tenantId),
  })
}

export function useAdjustSerialCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: AdjustSerialCodesDto }) =>
      adjustSerialCodes(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-serial-codes", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useApproveTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => approveTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useRejectTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason: string }) => rejectTenant(tenantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}
