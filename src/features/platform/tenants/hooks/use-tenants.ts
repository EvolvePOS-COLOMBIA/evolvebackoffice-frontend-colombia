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
} from "@/features/platform/tenants/services/tenant.service"
import { bulkUpdateTenantModules } from "@/features/platform/tenants/services/tenant-modules.service"
import type {
  CreateTenantDto,
  UpdateTenantDto,
  BulkUpdateTenantModuleItemDto,
  AdjustSerialCodesDto,
} from "@/features/platform/tenants/types/api"
import type { TenantFormValues } from "@/features/platform/tenants/types"

function toCreateDto(values: TenantFormValues): CreateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
    maxRegisters: values.maxRegisters,
    adminIdentification: values.adminIdentification || null,
    subdomain: values.subdomain || null,
    identificationNumber: values.identificationNumber || null,
    identificationTypeId: values.identificationTypeId,
    maxBranches: values.maxBranches || null,
    maxUsers: values.maxUsers || null,
  }
}

function toUpdateDto(values: TenantFormValues): UpdateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
    subdomain: values.subdomain || null,
    identificationNumber: values.identificationNumber || null,
    identificationTypeId: values.identificationTypeId || null,
    maxRegisters: values.maxRegisters || null,
    maxBranches: values.maxBranches || null,
    maxUsers: values.maxUsers || null,
  }
}

function toBulkModuleItems(
  modules: TenantFormValues["modules"]
): BulkUpdateTenantModuleItemDto[] {
  return modules.map((m) => ({
    modulePublicId: m.moduleId,
    isEnabled: m.isEnabled,
    quantity: m.quantity,
  }))
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
    mutationFn: ({
      values,
      token,
    }: {
      values: TenantFormValues
      token: string
    }) =>
      createTenant(toCreateDto(values)).then(async (result) => {
        if (values.modules.length > 0) {
          await bulkUpdateTenantModules(token, result.id, toBulkModuleItems(values.modules))
        }
        return result
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      values,
      token,
    }: {
      id: string
      values: TenantFormValues
      token: string
    }) =>
      updateTenant(id, toUpdateDto(values)).then(async (result) => {
        if (values.modules.length > 0) {
          await bulkUpdateTenantModules(token, id, toBulkModuleItems(values.modules))
        }
        return result
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
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
    mutationFn: ({
      tenantId,
      serialId,
      reason,
    }: {
      tenantId: string
      serialId: string
      reason?: string
    }) => decommissionSerial(tenantId, serialId, reason),
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
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string
      data: AdjustSerialCodesDto
    }) => adjustSerialCodes(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-serial-codes", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}
